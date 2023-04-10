// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ISortedOracles.sol";
import "../../core/RedstoneAdapterBase.sol";

/**
 * @title Redstone oracles adapter for the Mento SortedOracles contract
 * @author The Redstone Oracles team
 * @dev This contract should be whitelisted as an oracle client in the
 * SortedOracles contract. It allows anyone to push signed oracle data
 * to report them in the Mento SortedOracles contract. It is ownable,
 * the owner can manage delivered data feeds and corresponding token
 * addresses.
 *
 */
abstract contract MentoAdapterBase is RedstoneAdapterBase, Ownable {
  using EnumerableMap for EnumerableMap.UintToAddressMap;

  struct DataFeedDetails {
    bytes32 dataFeedId;
    address tokenAddress;
  }

  // RedStone provides values with 8 decimals
  // Mento sorted oracles expect 24 decimals (24 - 8 = 16)
  uint256 private constant PRICE_MULTIPLIER = 1e16;

  uint256 private constant LOCATIONS_ARG_CALLDATA_OFFSET = 36; // 4 bytes for function selector + 32 bytes for proposedTimestamp

  ISortedOracles public sortedOracles;
  EnumerableMap.UintToAddressMap private dataFeedIdToTokenAddressMap;

  struct LocationInSortedLinkedList {
    address lesserKey;
    address greaterKey;
  }

  constructor(ISortedOracles sortedOracles_) {
    sortedOracles = sortedOracles_;
  }

  function updateSortedOraclesAddress(ISortedOracles sortedOracles_) public onlyOwner {
    sortedOracles = sortedOracles_;
  }

  /**
   * @notice Helpful function to simplify the mento relayer implementation
   */
  function updatePriceValuesAndCleanOldReports(
    uint256 proposedTimestamp,
    LocationInSortedLinkedList[] calldata locationsInSortedLinkedLists
  ) external {
    updatePriceValues(proposedTimestamp, locationsInSortedLinkedLists);
    removeAllExpiredReports();
  }

  /**
   * @notice Used for getting proposed values from RedStone's data packages
   * @param dataFeedIds An array of data feed identifiers
   * @return values The normalized values for corresponding data feeds
   */
  function getNormalizedOracleValuesFromTxCalldata(bytes32[] calldata dataFeedIds)
    external
    view
    returns (uint256[] memory)
  {
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);
    for (uint256 i = 0; i < values.length; i++) {
      values[i] = normalizeRedstoneValueForMento(values[i]);
    }
    return values;
  }

  function removeAllExpiredReports() public {
    uint256 tokensLength = getDataFeedsCount();
    for (uint256 tokenIndex = 0; tokenIndex < tokensLength; tokenIndex++) {
      (, address tokenAddress) = getTokenDetailsAtIndex(tokenIndex);
      uint256 curNumberOfReports = sortedOracles.numTimestamps(tokenAddress);
      if (curNumberOfReports > 0) {
        sortedOracles.removeExpiredReports(tokenAddress, curNumberOfReports - 1);
      }
    }
  }

  function normalizeRedstoneValueForMento(uint256 valueFromRedstone)
    public
    pure
    returns (uint256)
  {
    return PRICE_MULTIPLIER * valueFromRedstone;
  }

  /**
   * @notice Extracts Redstone's oracle values from calldata, verifying signatures
   * and timestamps, and reports it to the SortedOracles contract
   * @param proposedTimestamp Timestamp that should be lesser or equal to each
   * timestamp from the signed data packages in calldata
   * @param locationsInSortedLinkedLists The array of locations in linked list for reported values
   */
  function updatePriceValues(
    uint256 proposedTimestamp,
    LocationInSortedLinkedList[] calldata locationsInSortedLinkedLists
  ) public {
    locationsInSortedLinkedLists; // This function is used later
    updateDataFeedsValues(proposedTimestamp);
  }

  function validateAndUpdateDataFeedValues(bytes32[] memory dataFeedIds, uint256[] memory values)
    internal
    override
  {
    (, , LocationInSortedLinkedList[] memory locationsInSortedList, ) = parseTxCalldata();
    for (uint256 dataFeedIndex = 0; dataFeedIndex < dataFeedIds.length; dataFeedIndex++) {
      bytes32 dataFeedId = dataFeedIds[dataFeedIndex];
      address tokenAddress = getTokenAddressByDataFeedId(dataFeedId);
      uint256 priceValue = normalizeRedstoneValueForMento(values[dataFeedIndex]);
      LocationInSortedLinkedList memory location = locationsInSortedList[dataFeedIndex];

      sortedOracles.report(tokenAddress, priceValue, location.lesserKey, location.greaterKey);
    }
  }

  // TODO: refactor this function
  // But it works for now
  function parseTxCalldata()
    private
    pure
    returns (
      bytes4 funSignature,
      uint256 proposedTimestamp,
      LocationInSortedLinkedList[] memory locationsInSortedList,
      bytes memory redstonePayload
    )
  {
    // 68 = 4 (fun selector) + 32 (proposedTimestamp) + 32 (size of one LocationInSortedLinkedList)
    uint256 locationsLength = abi.decode(msg.data[68:100], (uint256));

    locationsInSortedList = new LocationInSortedLinkedList[](locationsLength);
    for (uint256 i = 0; i < locationsLength; i++) {
      LocationInSortedLinkedList memory location;
      location.lesserKey = abi.decode(msg.data[100 + i * 64:132 + i * 64], (address));
      location.greaterKey = abi.decode(msg.data[132 + i * 64:164 + i * 64], (address));
      locationsInSortedList[i] = location;
    }

    funSignature = 0;
    proposedTimestamp = 42;
    redstonePayload;

    // TODO: unduserstand why this doesn't work
    // (funSignature, proposedTimestamp, locationsInSortedList, redstonePayload) = abi.decode(
    //   msg.data,
    //   (bytes4, uint256, LocationInSortedLinkedList[], bytes)
    // );
  }

  // Adds or updates token address for a given data feed id
  function setDataFeed(bytes32 dataFeedId, address tokenAddress) external onlyOwner {
    dataFeedIdToTokenAddressMap.set(uint256(dataFeedId), tokenAddress);
  }

  function removeDataFeed(bytes32 dataFeedId) external onlyOwner {
    dataFeedIdToTokenAddressMap.remove(uint256(dataFeedId));
  }

  function getDataFeedsCount() public view returns (uint256) {
    return dataFeedIdToTokenAddressMap.length();
  }

  function getTokenAddressByDataFeedId(bytes32 dataFeedId) public view returns (address) {
    return dataFeedIdToTokenAddressMap.get(uint256(dataFeedId));
  }

  function getDataFeedIds() public view override returns (bytes32[] memory) {
    uint256 dataFeedsCount = getDataFeedsCount();
    bytes32[] memory dataFeedIds = new bytes32[](dataFeedsCount);
    for (uint256 dataFeedIndex = 0; dataFeedIndex < dataFeedsCount; dataFeedIndex++) {
      (dataFeedIds[dataFeedIndex], ) = getTokenDetailsAtIndex(dataFeedIndex);
    }

    return dataFeedIds;
  }

  function getDataFeeds() public view returns (DataFeedDetails[] memory) {
    uint256 dataFeedsCount = getDataFeedsCount();
    DataFeedDetails[] memory dataFeeds = new DataFeedDetails[](dataFeedsCount);
    for (uint256 dataFeedIndex = 0; dataFeedIndex < dataFeedsCount; dataFeedIndex++) {
      (bytes32 dataFeedId, address tokenAddress) = getTokenDetailsAtIndex(dataFeedIndex);
      dataFeeds[dataFeedIndex] = DataFeedDetails({
        dataFeedId: dataFeedId,
        tokenAddress: tokenAddress
      });
    }
    return dataFeeds;
  }

  function getTokenDetailsAtIndex(uint256 tokenIndex)
    public
    view
    returns (bytes32 dataFeedId, address tokenAddress)
  {
    (uint256 dataFeedIdNumber, address tokenAddress_) = dataFeedIdToTokenAddressMap.at(tokenIndex);
    dataFeedId = bytes32(dataFeedIdNumber);
    tokenAddress = tokenAddress_;
  }

  // Reads from on-chain storage
  function getValueForDataFeedUnsafe(bytes32 dataFeedId) public pure override returns (uint256) {
    dataFeedId;
    // TODO: implement reading from sorted oracles
    return 42;
  }
}
