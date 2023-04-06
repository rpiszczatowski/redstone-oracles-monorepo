// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "./PriceFeedsAdapterWithRounds.sol";
import "../PriceFeedBase.sol";

contract PriceFeed is PriceFeedBase {
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
    (uint256 dataFeedValue, uint256 roundTimestampInMilliseconds) = priceFeedsAdapter.getRoundData(
      dataFeedId,
      requestedRoundId
    );
    roundId = requestedRoundId;
    answer = int256(dataFeedValue);
    startedAt = roundTimestampInMilliseconds / 1000;
    updatedAt = startedAt;
    answeredInRound = requestedRoundId;
  }
}
