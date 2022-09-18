// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./StakingRegistry.sol";

contract DisputeResolutionEngine is OwnableUpgradeable {
  uint256 constant MIN_LOCK_AMOUNT_FOR_DISPUTE_CREATION = 10_000 * 10**18;
  uint256 constant MIN_LOCK_AMOUNT_FOR_VOTING = 5_000 * 10**18;
  uint256 constant PENALTY_AMOUNT = 2_000 * 10**18;
  uint256 constant COMMIT_PERIOD_SECONDS = 4 * 24 * 3600; // 4 days
  uint256 constant REVEAL_PERIOD_SECONDS = 3 * 24 * 3600; // 3 days
  uint256 constant LOCK_PERIOD_FOR_UNSTAKING_SECONDS = 30 * 24 * 3600; // 30 days

  enum DisputeVerdict {
    Unknown,
    Guilty,
    NotGuilty
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
    uint256 revealedForGuiltyAmount;
    uint256 revealedForNotGuiltyAmount;
    uint256 rewardPoolTokensAmount;
    mapping(address => Vote) votes;
    DisputeVerdict verdict;
  }

  IERC20 private _redstoneToken;
  Dispute[] private _disputes;
  StakingRegistry private _stakingRegistry;

  constructor(address redstoneTokenAddress) {
    _stakingRegistry = new StakingRegistry(
      redstoneTokenAddress,
      address(this),
      LOCK_PERIOD_FOR_UNSTAKING_SECONDS
    );
    _redstoneToken = IERC20(redstoneTokenAddress);
  }

  function createDispute(
    address accusedAddress,
    string calldata arweaveUrlWithDisputeDetails,
    uint256 lockedTokensAmount
  ) external {
    require(
      lockedTokensAmount >= MIN_LOCK_AMOUNT_FOR_DISPUTE_CREATION,
      "Insufficient locked tokens amount for dispute creation"
    );

    Dispute storage newDispute = _disputes.push();
    newDispute.creatorAddress = msg.sender;
    newDispute.accusedAddress = accusedAddress;
    newDispute.creationTimestampSeconds = block.timestamp;
    newDispute.arweaveUrlWithDisputeDetails = arweaveUrlWithDisputeDetails;
    newDispute.verdict = DisputeVerdict.Unknown;

    // The code below commented to save gas, because these fields
    // will be set to zero anyway. But we left the commented code
    // to improve the code readability :)
    // newDispute.revealedForGuiltyAmount = 0;
    // newDispute.revealedForNotGuiltyAmount = 0;
    // newDispute.rewardPoolTokensAmount = 0;

    // Dispute creator automatically votes for guilty and their vote is
    // automatically revealed. That's why we pass a zero commit hash here
    _lockTokensAndCreateVote(newDispute, bytes32(0), lockedTokensAmount);
  }

  function commitVote(
    uint256 disputeId,
    uint256 lockedTokensAmount,
    bytes32 commitHash
  ) external {
    Dispute storage dispute = _disputes[disputeId];

    require(
      lockedTokensAmount >= MIN_LOCK_AMOUNT_FOR_VOTING,
      "Insufficient locked tokens amount for voting"
    );
    require(
      block.timestamp < dispute.creationTimestampSeconds + COMMIT_PERIOD_SECONDS,
      "Commit period ended"
    );

    _lockTokensAndCreateVote(dispute, commitHash, lockedTokensAmount);
  }

  function revealVote(
    uint256 disputeId,
    bytes32 salt,
    bool votedForGuilty
  ) external {
    Dispute storage dispute = _disputes[disputeId];
    Vote storage vote = dispute.votes[msg.sender];

    // Checking if the user can reveal their vote
    require(
      block.timestamp <
        dispute.creationTimestampSeconds + COMMIT_PERIOD_SECONDS + REVEAL_PERIOD_SECONDS,
      "Reveal period ended"
    );
    require(vote.lockedTokensAmount > 0, "Cannot find the commited vote to reveal");

    // Verifying commit hash against the revealed vote
    bytes32 expectedCommitHash = calculateHashForVote(disputeId, salt, votedForGuilty);
    require(
      expectedCommitHash == vote.commitHash,
      "Commited hash doesn't match with the revealed vote"
    );

    // Saving user vote details
    vote.revealedVote = true;
    vote.votedForGuilty = votedForGuilty;
    if (votedForGuilty) {
      dispute.revealedForGuiltyAmount += vote.lockedTokensAmount;
    } else {
      dispute.revealedForNotGuiltyAmount += vote.lockedTokensAmount;
    }
  }

  // Anyone can settle a dispute that has not beed settled before
  // when its reveal period ends. Settlement period is not limited in time
  function settleDispute(uint256 disputeId) external {
    Dispute storage dispute = _disputes[disputeId];

    // Checking if the dispute can be settled
    require(dispute.verdict == DisputeVerdict.Unknown, "Dispute has already been settled");
    require(
      block.timestamp >
        dispute.creationTimestampSeconds + COMMIT_PERIOD_SECONDS + REVEAL_PERIOD_SECONDS,
      "Settlement period hasn't started yet"
    );

    // Setting verdict for the dispute
    if (dispute.revealedForGuiltyAmount > dispute.revealedForNotGuiltyAmount) {
      dispute.verdict = DisputeVerdict.Guilty;

      // Safely slashing stake from the guilty provider
      // And adding it to the dispute reward pool
      uint256 availableStakedBalance = _stakingRegistry.getStakedBalance(dispute.accusedAddress);
      if (availableStakedBalance >= PENALTY_AMOUNT) {
        _stakingRegistry.slashStake(dispute.accusedAddress, PENALTY_AMOUNT);
        dispute.rewardPoolTokensAmount += PENALTY_AMOUNT;
      }
    } else {
      dispute.verdict = DisputeVerdict.NotGuilty;
    }
  }

  // If a user has won a dispute, they need to manually claim reward
  function claimRewardForDispute(uint256 disputeId) external {
    uint256 rewardForUser = calculatePendingRewardForUser(disputeId, msg.sender);
    _disputes[disputeId].votes[msg.sender].claimedReward = true;
    _redstoneToken.transfer(msg.sender, rewardForUser);
  }

  function calculatePendingRewardForUser(uint256 disputeId, address userAddress)
    public
    view
    returns (uint256)
  {
    Dispute storage dispute = _disputes[disputeId];
    Vote storage userVote = dispute.votes[userAddress];

    // Checking if the user is elgigble for the reward
    require(dispute.verdict != DisputeVerdict.Unknown, "Dispute has not been sttled yet");
    require(userVote.revealedVote, "User didn't reveal vote");
    require(
      userVote.votedForGuilty || dispute.verdict == DisputeVerdict.NotGuilty,
      "User didn't win the dispute"
    );
    require(!userVote.claimedReward, "User already claimed reward for this dispute");

    // Calculaing reward amount for the user
    uint256 totalLockedTokenOfAllWinners = _max(
      dispute.revealedForGuiltyAmount,
      dispute.revealedForNotGuiltyAmount
    );
    uint256 userRewardAmount = (dispute.rewardPoolTokensAmount * userVote.lockedTokensAmount) /
      totalLockedTokenOfAllWinners;

    return userRewardAmount;
  }

  // We strongly recommend voters to calculate salt off-chain using the
  // pseudo-algorithm below. It is not required by this smart contract,
  // but will allow users to unambiguously recover it for vote revealing
  // bytes memory signableMessage = abi.encodePacked(disputeId, "REDSTONE_DISPUTE_SALT");
  // bytes32 hashedMessage = keccak256(signableMessage);
  // bytes memory signature = ECDSA.sign(hashedMessage, userPrivateKey);
  // bytes32 salt = keccak256(signature);
  function calculateHashForVote(
    uint256 disputeId,
    bytes32 salt,
    bool votedForGuilty
  ) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(disputeId, salt, votedForGuilty));
  }

  function _lockTokensAndCreateVote(
    Dispute storage dispute,
    bytes32 commitHash,
    uint256 lockedTokensAmount
  ) private {
    require(
      dispute.votes[msg.sender].lockedTokensAmount == 0,
      "Already locked some tokens for this dispute"
    );

    // Locking tokens on this contract. It will fail if user hasn't approved
    // tokens spending by this contract
    _redstoneToken.transferFrom(msg.sender, address(this), lockedTokensAmount);

    // Saving a new vote
    bool isDisputeCreator = dispute.creatorAddress == msg.sender;
    dispute.votes[msg.sender] = Vote({
      lockedTokensAmount: lockedTokensAmount,
      commitHash: commitHash,
      revealedVote: isDisputeCreator,
      votedForGuilty: isDisputeCreator,
      claimedReward: false
    });

    // Increasing reawrd pool for the dispute
    dispute.rewardPoolTokensAmount += lockedTokensAmount;
  }

  // Helpful function to get the maximum value of two numbers
  function _max(uint256 a, uint256 b) internal pure returns (uint256) {
    return a >= b ? a : b;
  }
}
