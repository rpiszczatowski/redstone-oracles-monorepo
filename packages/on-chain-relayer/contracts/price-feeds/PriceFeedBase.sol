// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.4;

import "../core/IRedstoneAdapter.sol";
import "./interfaces/IPriceFeed.sol";
import "./interfaces/IPriceFeedAdapter.sol";

abstract contract PriceFeedBase is IPriceFeed {
  bytes32 public dataFeedId;
  string public descriptionText;

  constructor(bytes32 dataFeedId_, string memory description_) {
    dataFeedId = dataFeedId_;
    descriptionText = description_;
  }

  function getPriceFeedAdapter() public view virtual returns (IPriceFeedAdapter);

  function decimals() public pure override returns (uint8) {
    return 8;
  }

  function description() public view override returns (string memory) {
    return descriptionText;
  }

  function version() public pure override returns (uint256) {
    return 1;
  }

  function latestRoundData()
    public
    view
    override
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    roundId = latestRound();
    answer = latestAnswer();

    (uint128 dataTimestamp, uint128 blockTimestamp) = getPriceFeedAdapter()
      .getTimestampsFromLatestUpdate();

    startedAt = dataTimestamp / 1000; // convert to seconds
    updatedAt = blockTimestamp;
    answeredInRound = roundId;
  }

  // Below are methods that are not part of the AggregatorV3Interface,
  // but are still used by some projects integrated with Chainlink (e.g. GMX)

  function latestAnswer() public view returns (int256) {
    return int256(getPriceFeedAdapter().getValueForDataFeed(dataFeedId));
  }

  function latestRound() public view virtual returns (uint80) {
    return 0;
  }
}
