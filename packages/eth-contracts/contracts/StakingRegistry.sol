// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract StakingRegistry is OwnableUpgradeable {
  struct UserStakingDetails {
    uint256 stakedAmount;
    uint256 pendingAmountToUnstake;
    uint256 unstakeOpeningTimestampSeconds;
  }

  event UnstakeRequested(address user, UserStakingDetails stakingDetails);
  event UnstakeCompleted(address user, UserStakingDetails stakingDetails);

  uint256 lockPeriodForUnstakingSeconds;
  IERC20 public stakingToken;
  address public authorisedStakeSlasher;
  mapping(address => UserStakingDetails) stakingDetailsForUsers;

  constructor(
    address _stakingTokenAddress,
    address _authorisedStakeSlasher,
    uint256 _lockPeriodForUnstakingSeconds
  ) {
    stakingToken = IERC20(_stakingTokenAddress);
    authorisedStakeSlasher = _authorisedStakeSlasher;
    lockPeriodForUnstakingSeconds = _lockPeriodForUnstakingSeconds;
  }

  // Before calling this function tx sender should allow spending
  // the staking amount by this contract
  function stake(uint256 stakingAmount) external {
    stakingToken.transferFrom(msg.sender, address(this), stakingAmount);
    stakingDetailsForUsers[msg.sender].stakedAmount += stakingAmount;
  }

  function requestUnstake(uint256 amountToUnstake) external {
    UserStakingDetails storage userStakingDetails = stakingDetailsForUsers[msg.sender];
    require(amountToUnstake > 0, "Amount to unstake must be a positive number");
    require(
      userStakingDetails.stakedAmount >= amountToUnstake,
      "Can not request to unstake more than staked"
    );

    userStakingDetails.pendingAmountToUnstake = amountToUnstake;
    userStakingDetails.unstakeOpeningTimestampSeconds =
      block.timestamp +
      lockPeriodForUnstakingSeconds;

    emit UnstakeRequested(msg.sender, userStakingDetails);
  }

  function completeUnstake() external {
    UserStakingDetails storage userStakingDetails = stakingDetailsForUsers[msg.sender];
    require(
      block.timestamp > userStakingDetails.unstakeOpeningTimestampSeconds,
      "Unstaking is not opened yet"
    );
    require(userStakingDetails.pendingAmountToUnstake > 0, "User hasn't requested unstake before");

    // Unstaking
    userStakingDetails.stakedAmount -= userStakingDetails.pendingAmountToUnstake;
    stakingToken.transfer(msg.sender, userStakingDetails.pendingAmountToUnstake);
    userStakingDetails.pendingAmountToUnstake = 0;

    emit UnstakeCompleted(msg.sender, userStakingDetails);
  }

  function getStakedBalance(address addr) public view returns (uint256) {
    return stakingDetailsForUsers[addr].stakedAmount;
  }

  function slashStake(address slashedAddress, uint256 slashedAmount) public {
    require(msg.sender == authorisedStakeSlasher, "Tx sender is not authorised to slash stakes");
    require(
      stakingDetailsForUsers[slashedAddress].stakedAmount >= slashedAmount,
      "Staking balance is lower than the requested slashed amount"
    );
    stakingDetailsForUsers[slashedAddress].stakedAmount -= slashedAmount;
    stakingToken.transfer(msg.sender, slashedAmount);
  }
}
