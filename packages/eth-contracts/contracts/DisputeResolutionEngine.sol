// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./StakingRegistry.sol";

contract DisputeResolutionEngine is OwnableUpgradeable {
  uint256 constant MIN_LOCK_AMOUNT_FOR_DISPUTE_CREATION = 10_000 * 10**18;
  uint256 constant MIN_LOCK_AMOUNT_FOR_VOTING = 10_000 * 10**18;
  uint256 constant PENALTY_AMOUNT = 2_000 * 10**18;
  uint256 constant COMMIT_PERIOD_SECONDS = 4 * 24 * 3600; // 4 days
  uint256 constant REVEAL_PERIOD_SECONDS = 3 * 24 * 3600; // 3 days

  enum DisputeVerdict {
    UNKNOWN,
    GUILTY,
    NOT_GUILTY
  }

  struct Vote {
    uint256 lockedTokensAmount;
    bytes32 commitHash;
    bool revealedVote;
    bool votedForGuilty;
    bool claimedReward;
  }

  struct Dispute {
    address creatorAddress;
    address accusedAddress;
    uint256 creationTimestampSeconds;
    string arweaveUrlWithDisputeDetails;
    DisputeVerdict verdict;
    mapping(address => Vote) votes;
    uint256 lockedTokensAndRevealedVoteForGuilty;
    uint256 lockedTokensAndRevealedVoteForNotGuilty;
    uint256 rewardPoolTokensAmount;
  }

  IERC20 public redstoneToken;
  Dispute[] public disputes;
  StakingRegistry public stakingRegistry;

  constructor(address _redstoneTokenAddress) {
    stakingRegistry = new StakingRegistry(_redstoneTokenAddress, address(this));
    redstoneToken = IERC20(_redstoneTokenAddress);
  }

  // TODO: maybe we also should check if the accused address is still in the providers registry and
  // has enough staked tokens to pay in case of being guilty
  // and the amount of tokens will not be unstaked by the end of the dispute
  function createDispute(
    address _accusedAddress,
    string calldata _arweaveUrlWithDisputeDetails,
    uint256 _lockedTokensAmount
  ) external {
    require(
      _lockedTokensAmount >= MIN_LOCK_AMOUNT_FOR_DISPUTE_CREATION,
      "Insufficient locked tokens amount for dispute creation"
    );

    Dispute storage newDispute = disputes.push();
    newDispute.creatorAddress = msg.sender;
    newDispute.accusedAddress = _accusedAddress;
    newDispute.creationTimestampSeconds = block.timestamp;
    newDispute.arweaveUrlWithDisputeDetails = _arweaveUrlWithDisputeDetails;
    newDispute.verdict = DisputeVerdict.UNKNOWN;

    // TODO: maybe remove setting to zeros below
    newDispute.lockedTokensAndRevealedVoteForGuilty = 0;
    newDispute.lockedTokensAndRevealedVoteForNotGuilty = 0;
    newDispute.rewardPoolTokensAmount = 0;

    _lockTokensAndCreateVote(newDispute, bytes32(0), _lockedTokensAmount);
  }

  function commitVote(
    uint256 _disputeId,
    uint256 _lockedTokensAmount,
    bytes32 _commitHash
  ) external {
    require(
      _lockedTokensAmount >= MIN_LOCK_AMOUNT_FOR_VOTING,
      "Insufficient locked tokens amount for voting"
    );
    Dispute storage dispute = disputes[_disputeId];
    require(
      block.timestamp < dispute.creationTimestampSeconds + COMMIT_PERIOD_SECONDS,
      "Commit period ended"
    );
    _lockTokensAndCreateVote(dispute, _commitHash, _lockedTokensAmount);
  }

  function revealVote(
    uint256 _disputeId,
    uint256 _salt,
    bool _votedForGuilty
  ) external {
    Dispute storage dispute = disputes[_disputeId];
    require(
      block.timestamp <
        dispute.creationTimestampSeconds + COMMIT_PERIOD_SECONDS + REVEAL_PERIOD_SECONDS,
      "Reveal period ended"
    );
    Vote storage vote = dispute.votes[msg.sender];
    require(vote.lockedTokensAmount > 0, "Cannot find the commited vote to reveal");

    bytes32 expectedCommitHash = calculateHashForVote(_disputeId, _salt, _votedForGuilty);
    require(
      expectedCommitHash == vote.commitHash,
      "Commited hash doesn't match with the revealed vote"
    );

    vote.revealedVote = true;
    vote.votedForGuilty = _votedForGuilty;
    if (_votedForGuilty) {
      dispute.lockedTokensAndRevealedVoteForGuilty += vote.lockedTokensAmount;
    } else {
      dispute.lockedTokensAndRevealedVoteForNotGuilty += vote.lockedTokensAmount;
    }
  }

  function settleDispute(uint256 _disputeId) external {
    Dispute storage dispute = disputes[_disputeId];
    require(dispute.verdict == DisputeVerdict.UNKNOWN, "Dispute has already been settled");
    require(
      block.timestamp >
        dispute.creationTimestampSeconds + COMMIT_PERIOD_SECONDS + REVEAL_PERIOD_SECONDS,
      "Settlement period hasn't started yet"
    );

    // Setting the dispute verdict
    if (
      dispute.lockedTokensAndRevealedVoteForGuilty >
      dispute.lockedTokensAndRevealedVoteForNotGuilty
    ) {
      dispute.verdict = DisputeVerdict.GUILTY;

      // Slashing stake from guilty provider
      // And adding it to the reward pool
      uint256 availableStakedBalance = stakingRegistry.getStakedBalance(dispute.accusedAddress);
      if (availableStakedBalance >= PENALTY_AMOUNT) {
        stakingRegistry.slashStake(dispute.accusedAddress, PENALTY_AMOUNT);
        dispute.rewardPoolTokensAmount += PENALTY_AMOUNT;
      }
    } else {
      dispute.verdict = DisputeVerdict.NOT_GUILTY;
    }
  }

  function claimTokensForDispute(uint256 _disputeId) external {
    uint256 rewardForUser = calculatePendingRewardForUser(_disputeId, msg.sender);
    disputes[_disputeId].votes[msg.sender].claimedReward = true;
    redstoneToken.transfer(msg.sender, rewardForUser);
  }

  function calculatePendingRewardForUser(uint256 _disputeId, address _userAddress)
    public
    view
    returns (uint256)
  {
    Dispute storage dispute = disputes[_disputeId];
    require(dispute.verdict != DisputeVerdict.UNKNOWN, "Dispute has not been sttled yet");
    Vote storage userVote = dispute.votes[_userAddress];
    require(userVote.revealedVote, "User didn't reveal vote");
    require(
      userVote.votedForGuilty || dispute.verdict == DisputeVerdict.NOT_GUILTY,
      "User didn't win the dispute"
    );
    require(!userVote.claimedReward, "User already claimed reward for this dispute");

    uint256 totalLockedTokenOfAllWinners = _max(
      dispute.lockedTokensAndRevealedVoteForGuilty,
      dispute.lockedTokensAndRevealedVoteForNotGuilty
    );

    // TODO: maybe use SafeMath here
    return
      (dispute.rewardPoolTokensAmount * userVote.lockedTokensAmount) /
      totalLockedTokenOfAllWinners;
  }

  function calculateHashForVote(
    uint256 _disputeId,
    uint256 _salt,
    bool _votedForGuilty
  ) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(_disputeId, _salt, _votedForGuilty));
  }

  function _lockTokensAndCreateVote(
    Dispute storage _dispute,
    bytes32 _commitHash,
    uint256 _lockedTokensAmount
  ) internal {
    require(
      _dispute.votes[msg.sender].lockedTokensAmount == 0,
      "Already locked some tokens for this dispute"
    );
    redstoneToken.transferFrom(msg.sender, address(this), _lockedTokensAmount);

    bool isDisputeCreator = _dispute.creatorAddress == msg.sender;
    _dispute.votes[msg.sender] = Vote({
      lockedTokensAmount: _lockedTokensAmount,
      commitHash: _commitHash,
      revealedVote: isDisputeCreator,
      votedForGuilty: isDisputeCreator,
      claimedReward: false
    });
    _dispute.rewardPoolTokensAmount += _lockedTokensAmount;
  }

  function _max(uint256 a, uint256 b) internal pure returns (uint256) {
    return a >= b ? a : b;
  }
}
