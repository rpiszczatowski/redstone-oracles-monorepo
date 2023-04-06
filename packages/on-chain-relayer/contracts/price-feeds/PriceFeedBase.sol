// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./interfaces/IPriceFeedAdapter.sol";
import "./interfaces/IPriceFeed.sol";

abstract contract PriceFeedBase is IPriceFeed {
  bytes32 public dataFeedId;
  string public descriptionText;

  constructor(bytes32 dataFeedId_, string memory description_) {
    dataFeedId = dataFeedId_;
    descriptionText = description_;
  }

  function getPriceFeedAdapter() public view virtual returns (IPriceFeedAdapter);

  function decimals() external pure override returns (uint8) {
    return 8;
  }

  function description() external view override returns (string memory) {
    return descriptionText;
  }

  function version() external pure override returns (uint256) {
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
    startedAt = getPriceFeedAdapter().getLastUpdateTimestamp();
    updatedAt = startedAt;
    answeredInRound = roundId;
  }

  // Below are methods that are not part of the AggregatorV3Interface,
  // but are still used by some projects integrated with Chainlink (e.g. GMX)

  function latestAnswer() public view returns (int256) {
    return int256(getPriceFeedAdapter().getValueForDataFeed(dataFeedId));
  }

  function latestRound() public pure virtual returns (uint80) {
    return 0;
  }
}
