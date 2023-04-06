// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@redstone-finance/evm-connector/contracts/core/RedstoneConsumerNumericBase.sol";
import "./interfaces/IPriceFeedAdapter.sol";
import "../core/PermissionlessPriceUpdater.sol";

abstract contract PriceFeedsAdapterBase is
  RedstoneConsumerNumericBase,
  Ownable,
  PermissionlessPriceUpdater,
  IPriceFeedAdapter
{
  using EnumerableSet for EnumerableSet.Bytes32Set;

  EnumerableSet.Bytes32Set private dataFeedsIds;

  constructor(bytes32[] memory dataFeedsIds_) {
    for (uint256 i = 0; i < dataFeedsIds_.length; i++) {
      EnumerableSet.add(dataFeedsIds, dataFeedsIds_[i]);
    }
  }

  function validateTimestamp(uint256 receivedTimestampMilliseconds) public view virtual override {
    RedstoneDefaultsLib.validateTimestamp(receivedTimestampMilliseconds);
    validateDataPackageTimestampAgainstProposedTimestamp(receivedTimestampMilliseconds);
  }

  /*
    We want to update data feeds values right after adding a new one.
    This is because without it someone could get the value of the newly
    added data feed before updating the value when it is still zero.
  */
  function addDataFeedIdAndUpdateValues(bytes32 newDataFeedId, uint256 proposedTimestamp)
    public
    onlyOwner
  {
    EnumerableSet.add(dataFeedsIds, newDataFeedId);
    updateDataFeedsValues(proposedTimestamp);
  }

  function removeDataFeedId(bytes32 dataFeedId) public onlyOwner {
    EnumerableSet.remove(dataFeedsIds, dataFeedId);
  }

  function getDataFeedsIds() public view returns (bytes32[] memory) {
    return dataFeedsIds._inner._values;
  }

  function updateDataFeedsValues(uint256 proposedTimestamp) public {
    validateAndUpdateProposedTimestamp(proposedTimestamp);

    bytes32[] memory dataFeedsIdsArray = getDataFeedsIds();

    /* 
      getOracleNumericValuesFromTxMsg will call validateTimestamp
      for each data package from the redstone payload 
    */
    uint256[] memory oracleValues = getOracleNumericValuesFromTxMsg(dataFeedsIdsArray);

    validateAndUpdateDataFeedValues(dataFeedsIdsArray, oracleValues);
  }

  // Note! This function is virtual and may contain additional logic in the derived contract
  // For example it can check if the updating conditions are met (e.g. at least one value is deviated enough)
  // Or it can check if values are not zero before saving them
  function validateAndUpdateDataFeedValues(
    bytes32[] memory dataFeedsIdsArray,
    uint256[] memory values
  ) internal virtual {
    for (uint256 i = 0; i < dataFeedsIdsArray.length; i++) {
      bytes32 dataFeedId = dataFeedsIdsArray[i];
      updateDataFeedValue(dataFeedId, values[i]);
    }
  }

  function updateDataFeedValue(bytes32 dataFeedId, uint256 value) internal virtual {}

  // Note! this function should be implemented in the derived contract
  function getValueForDataFeed(bytes32 dataFeedId) public view virtual returns (uint256);

  function getValuesForDataFeeds(bytes32[] memory requestedDataFeedsIds)
    public
    view
    returns (uint256[] memory)
  {
    uint256[] memory values = new uint256[](requestedDataFeedsIds.length);
    for (uint256 i = 0; i < requestedDataFeedsIds.length; i++) {
      values[i] = getValueForDataFeed(requestedDataFeedsIds[i]);
    }
    return (values);
  }
}
