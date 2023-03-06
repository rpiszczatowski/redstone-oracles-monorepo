// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../data-services/MainDemoConsumerBase.sol";

contract PriceFeedsManager is MainDemoConsumerBase, Initializable {
  uint256 public lastRound = 0;
  uint256 public lastUpdateTimestampMilliseconds = 0;
  mapping(bytes32 => uint256) dataFeedsValues;

  error ProposedTimestampSmallerOrEqualToLastTimestamp(
    uint256 lastUpdateTimestampMilliseconds,
    uint256 blockTimestamp
  );

  error ProposedTimestampDoesNotMatchReceivedTimestamp(
    uint256 proposedTimestamp,
    uint256 receivedTimestampMilliseconds
  );

  function validateTimestamp(uint256 receivedTimestampMilliseconds) public view override {
    RedstoneDefaultsLib.validateTimestamp(receivedTimestampMilliseconds);
    /* 
      Here lastUpdateTimestampMilliseconds is already updated inside updateDataFeedValues
      after validation in valivalidateTimestampFromUser and equal to proposedTimestamp
    */
    if (receivedTimestampMilliseconds != lastUpdateTimestampMilliseconds) {
      revert ProposedTimestampDoesNotMatchReceivedTimestamp(
        lastUpdateTimestampMilliseconds,
        receivedTimestampMilliseconds
      );
    }
  }

  function validateProposedTimestamp(uint256 proposedTimestamp) private view {
    if (proposedTimestamp <= lastUpdateTimestampMilliseconds) {
      revert ProposedTimestampSmallerOrEqualToLastTimestamp(
        proposedTimestamp,
        lastUpdateTimestampMilliseconds
      );
    }
  }

  function isProposedRoundValid(uint256 proposedRound) private view returns (bool) {
    return proposedRound == lastRound + 1;
  }

  function getLastRound() public view returns (uint256) {
    return lastRound;
  }

  function getLastUpdateTimestamp() public view returns (uint256) {
    return lastUpdateTimestampMilliseconds;
  }

  function getLastRoundParams() public view returns (uint256, uint256) {
    return (lastRound, lastUpdateTimestampMilliseconds);
  }

  function updateDataFeedValues(
    uint256 proposedRound,
    uint256 proposedTimestamp,
    bytes32[] calldata dataFeedsIds
  ) public {
    if (!isProposedRoundValid(proposedRound)) return;
    lastRound = proposedRound;
    validateProposedTimestamp(proposedTimestamp);
    lastUpdateTimestampMilliseconds = proposedTimestamp;

    /* 
      getOracleNumericValuesFromTxMsg will call validateTimestamp
      for each data package from the redstone payload 
    */
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedsIds);
    for (uint256 i = 0; i < dataFeedsIds.length; i++) {
      dataFeedsValues[dataFeedsIds[i]] = values[i];
    }
  }

  function getValueForDataFeed(bytes32 dataFeedId) public view returns (uint256) {
    return dataFeedsValues[dataFeedId];
  }

  function getValueForDataFeedAndLastRoundParas(bytes32 dataFeedId)
    public
    view
    returns (
      uint256,
      uint256,
      uint256
    )
  {
    return (dataFeedsValues[dataFeedId], lastRound, lastUpdateTimestampMilliseconds);
  }

  function getValuesForDataFeeds(bytes32[] memory dataFeedsIds)
    public
    view
    returns (bytes32[] memory, uint256[] memory)
  {
    uint256[] memory values = new uint256[](dataFeedsIds.length);
    for (uint256 i = 0; i < dataFeedsIds.length; i++) {
      values[i] = dataFeedsValues[dataFeedsIds[i]];
    }
    return (dataFeedsIds, values);
  }

  function getValuesForDataFeeds(bytes32[] memory dataFeedsIds)
    public
    view
    returns (bytes32[] memory, int256[] memory)
  {
    int256[] memory values = new int256[](dataFeedsIds.length);
    for (uint256 i = 0; i < dataFeedsIds.length; i++) {
      (, int256 dataFeedIdValue, , , ) = PriceFeed(
        priceFeedRegistry.getPriceFeedContractAddress(dataFeedsIds[i])
      ).latestRoundData();
      values[i] = dataFeedIdValue;
    }
    return (dataFeedsIds, values);
  }
}
