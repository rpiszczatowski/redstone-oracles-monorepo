// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

// TODO: add events
contract StakingRegistry is OwnableUpgradeable {
  uint256 constant STAKE_AMOUNT = 120_000 * 10**18;
  uint256 constant MAX_SLASHING_AMOUNT = 2_000 * 10**18;
  uint256 constant LOCK_PERIOD_FOR_UNSTAKING_SECONDS = 30 * 24 * 3600; // 30 days

  struct UserStakingDetails {
    uint256 stakedAmount;
    uint256 pendingUnstakingAmount;
    uint256 lastUnstakeRequestTimestampSeconds;
  }

  IERC20 public stakingToken;
  address public authorisedStakeSlasher;
  mapping(address => UserStakingDetails) stakingDetailsForUsers;
  mapping(address => uint256) stakingBalances;

  constructor(address _stakingTokenAddress, address _authorisedStakeSlasher) {
    stakingToken = IERC20(_stakingTokenAddress);
    authorisedStakeSlasher = _authorisedStakeSlasher;
  }

  // Before calling this function tx sender should allow spending
  // the staking amount by this contract
  function stake(uint256 stakingAmount) external {
    stakingToken.transferFrom(msg.sender, address(this), stakingAmount);
    stakingDetailsForUsers[msg.sender].stakedAmount += stakingAmount;
  }

  // function requestUnstake(uint256 amount) external {
  //   require(stakingDetailsForUsers[msg.sender] >= amount);
  // }

  // function unstake(uint256 amount) external {

  // }

  function getStakedBalance(address addr) public view returns (uint256) {
    return stakingDetailsForUsers[addr].stakedAmount;
  }

  function slashStake(address slashedAddress, uint256 slashedAmount) public {
    require(msg.sender == authorisedStakeSlasher, "Tx sender is not authorised to slash stakes");
    require(slashedAmount >= MAX_SLASHING_AMOUNT, "Requested slashed amoun is too big");
    require(
      stakingDetailsForUsers[slashedAddress].stakedAmount >= slashedAmount,
      "Staking balance is lower than the requested slashed amount"
    );
    stakingDetailsForUsers[slashedAddress].stakedAmount -= slashedAmount;
    stakingToken.transfer(msg.sender, slashedAmount);
  }
}
