// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "./PriceFeedsAdapterWithRounds.sol";
import "../PriceFeedBase.sol";

contract PriceFeedWithRounds is PriceFeedBase {
  PriceFeedsAdapterWithRounds public priceFeedsAdapter;

  constructor(
    PriceFeedsAdapterWithRounds priceFeedsAdapter_,
    bytes32 dataFeedId_,
    string memory description_
  ) PriceFeedBase(dataFeedId_, description_) {
    priceFeedsAdapter = priceFeedsAdapter_;
  }

  function getPriceFeedAdapter() public view override returns (IPriceFeedAdapter) {
    return priceFeedsAdapter;
  }

  function latestRound() public view override returns (uint80) {
    return uint80(priceFeedsAdapter.getLatestRoundId());
  }

  function getRoundData(uint80 requestedRoundId)
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
    (uint256 dataFeedValue, uint128 roundDataTimestamp, uint128 roundBlockTimestamp) = priceFeedsAdapter.getRoundData(
      dataFeedId,
      requestedRoundId
    );
    roundId = requestedRoundId;
    answer = int256(dataFeedValue);
    startedAt = roundDataTimestamp / 1000; // convert to seconds
    updatedAt = roundBlockTimestamp;
    answeredInRound = requestedRoundId;
  }
}
