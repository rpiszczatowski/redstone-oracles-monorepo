// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.4;

import "../PriceFeedBase.sol";

contract PriceFeedWithoutRounds is PriceFeedBase {
  IRedstoneAdapter public priceFeedsAdapter;

  error UnsupportedRoundId(uint80 requestedRoundId);

  function getPriceFeedAdapter() public view override returns (IRedstoneAdapter) {
    return priceFeedsAdapter;
  }

  // There are possible use cases that some contracts don't need values from old rounds
  // but still rely on `getRoundData` or `latestRounud` functions
  function getRoundData(uint80 requestedRoundId) public view override returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
    if (requestedRoundId != latestRound()) {
      revert UnsupportedRoundId(requestedRoundId);
    }
    return latestRoundData();
  }
}
