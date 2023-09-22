// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.14;

import {SinglePriceFeedBase} from "../SinglePriceFeedBase.sol";

// TODO: update comments here
/**
 * @title Implementation of a price feed contract without rounds support
 * @author The Redstone Oracles team
 * @dev This contract is abstract. The actual contract instance
 * must implement the following functions:
 * - getDataFeedId
 * - getPriceFeedAdapter
 */
abstract contract SinglePriceFeedWithoutRounds is SinglePriceFeedBase {
  error GetRoundDataCanBeOnlyCalledWithLatestRound(uint80 requestedRoundId);
  
  /**
   * @dev There are possible use cases that some contracts don't need values from old rounds
   * but still rely on `getRoundData` or `latestRounud` functions
   */
  function getRoundData(uint80 requestedRoundId) public view override returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
    if (requestedRoundId != latestRound()) {
      revert GetRoundDataCanBeOnlyCalledWithLatestRound(requestedRoundId);
    }
    return latestRoundData();
  }
}
