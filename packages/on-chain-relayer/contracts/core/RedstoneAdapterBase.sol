// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "@redstone-finance/evm-connector/contracts/core/RedstoneConsumerNumericBase.sol";
import "./IRedstoneAdapter.sol";

/**
 * @title Core logic of RedStone Adapter Contract
 * @author The Redstone Oracles team
 * @dev This contract is used to repeatedly push RedStone data to blockchain storage
 * More details here: https://docs.redstone.finance/docs/smart-contract-devs/get-started/redstone-classic
 * 
 * Key ideas of the contract:
 * - Data feed values can be updated using the `updateDataFeedValues` function
 * - All data feeds must be updated within a single call, partial updates are not allowed
 * - There is a configurable minimum interval between updates
 * - Updaters can be restricted by overriding `requireAuthorisedUpdater` function
 * - All data packages in redstone payload must have the same timestamp,
 *    equal to `dataPackagesTimestamp` argument of the `updateDataFeedValues` function
 */
abstract contract RedstoneAdapterBase is RedstoneConsumerNumericBase, IRedstoneAdapter {
  // We don't use storage variables to avoid potential problems with upgradable contracts
  bytes32 constant internal LATEST_UPDATE_TIMESTAMPS_STORAGE_LOCATION =
    0x3d01e4d77237ea0f771f1786da4d4ff757fcba6a92933aa53b1dcef2d6bd6fe2; // keccak256("RedStone.lastUpdateTimestamp");
  uint256 constant internal MIN_INTERVAL_BETWEEN_UPDATES = 10 seconds;
  uint256 constant internal BITS_COUNT_IN_16_BYTES = 128;

  error DataTimestampCanNotBeOlderThanBefore(
    uint256 receivedDataTimestampMilliseconds,
    uint256 lastDataTimestampMilliseconds
  );

  error MinIntervalBetweenUpdatesHasNotPassedYet(
    uint256 currentBlockTimestamp,
    uint256 lastUpdateTimestamp,
    uint256 minIntervalBetweenUpdates
  );

  error DataPackageTimestampMismatch(uint256 expectedDataTimestamp, uint256 dataPackageTimestamp);

  error DataFeedValueCannotBeZero(bytes32 dataFeedId);

  // This function should throw if msg.sender is not allowed to update data feed values
  // By default, anyone can update data feed values, but it can be overridden
  function requireAuthorisedUpdater(address updater) public view virtual {}

  function getDataFeedIds() public view virtual returns (bytes32[] memory);

  // This function requires redstone payload attached to the tx calldata
  function updateDataFeedValues(uint256 dataPackagesTimestamp) public {
    requireAuthorisedUpdater(msg.sender);
    validateCurrentBlockTimestamp();
    validateProposedDataPackagesTimestamp(dataPackagesTimestamp);
    _saveTimestampsOfCurrentUpdate(dataPackagesTimestamp);

    bytes32[] memory dataFeedsIdsArray = getDataFeedIds();

    // It will trigger timestamp validation for each data package
    uint256[] memory oracleValues = getOracleNumericValuesFromTxMsg(dataFeedsIdsArray);

    validateAndUpdateDataFeedValues(dataFeedsIdsArray, oracleValues);
  }

  // Important! You should not override this function in derived contracts
  // Timestamp validation is done once in the `updateDataFeedValues` function
  // But this function is called for each data package in redstone payload and just
  // Verifies if each data package has the same timestamp as saved in storage
  function validateTimestamp(uint256 receivedTimestampMilliseconds) public view override {
    uint256 expectedDataPackageTimestamp = getDataTimestampFromLatestUpdate();
    if (receivedTimestampMilliseconds != expectedDataPackageTimestamp) {
      revert DataPackageTimestampMismatch(
        expectedDataPackageTimestamp,
        receivedTimestampMilliseconds
      );
    }
  }

  function validateAndUpdateDataFeedValues(
    bytes32[] memory dataFeedIdsArray,
    uint256[] memory values
  ) internal virtual;

  function validateCurrentBlockTimestamp() private view {
    uint256 currentBlockTimestamp = block.timestamp;
    uint256 blockTimestampFromLatestUpdate = getBlockTimestampFromLatestUpdate();
    uint256 minIntervalBetweenUpdates = getMinIntervalBetweenUpdates();
    if (currentBlockTimestamp < blockTimestampFromLatestUpdate + minIntervalBetweenUpdates) {
      revert MinIntervalBetweenUpdatesHasNotPassedYet(
        currentBlockTimestamp,
        blockTimestampFromLatestUpdate,
        minIntervalBetweenUpdates
      );
    }
  }

  // You can override this function to change the required interval between udpates
  // Avoid setting it to 0, as it may open many attack vectors
  function getMinIntervalBetweenUpdates() public view virtual returns (uint256) {
    return MIN_INTERVAL_BETWEEN_UPDATES;
  }

  function validateProposedDataPackagesTimestamp(uint256 dataPackagesTimestamp)
    public
    view
    virtual
  {
    preventUpdateWithOlderDataPackages(dataPackagesTimestamp);
    RedstoneDefaultsLib.validateTimestamp(dataPackagesTimestamp);
  }

  function preventUpdateWithOlderDataPackages(uint256 dataPackagesTimestamp) internal view {
    uint256 dataTimestampFromLatestUpdate = getDataTimestampFromLatestUpdate();

    // We intentionally allow to update data with the same timestamp
    if (dataPackagesTimestamp < dataTimestampFromLatestUpdate) {
      revert DataTimestampCanNotBeOlderThanBefore(
        dataPackagesTimestamp,
        dataTimestampFromLatestUpdate
      );
    }
  }

  function getDataTimestampFromLatestUpdate() public view returns (uint256 lastDataTimestamp) {
    (lastDataTimestamp, ) = getTimestampsFromLatestUpdate();
  }

  function getBlockTimestampFromLatestUpdate() public view returns (uint256 blockTimestamp) {
    (, blockTimestamp) = getTimestampsFromLatestUpdate();
  }

  function getPackedTimestampsFromLatestUpdate() public view returns (uint256 packedTimestamps) {
    assembly {
      packedTimestamps := sload(LATEST_UPDATE_TIMESTAMPS_STORAGE_LOCATION)
    }
  }

  function getTimestampsFromLatestUpdate()
    public
    view
    returns (uint128 dataTimestamp, uint128 blockTimestamp)
  {
    uint256 packedTimestamps = getPackedTimestampsFromLatestUpdate();
    return _unpackTimestamps(packedTimestamps);
  }

  function _unpackTimestamps(uint256 packedTimestamps) internal pure returns (uint128 dataTimestamp, uint128 blockTimestamp) {
    dataTimestamp = uint128(packedTimestamps >> 128); // first 128 bits
    blockTimestamp = uint128(packedTimestamps); // last 128 bits
  }

  function _saveTimestampsOfCurrentUpdate(uint256 dataPackagesTimestamp) private {
    uint256 blockTimestamp = block.timestamp;
    assembly {
      let timestamps := packTwoNumbers(dataPackagesTimestamp, blockTimestamp)
      sstore(LATEST_UPDATE_TIMESTAMPS_STORAGE_LOCATION, timestamps)

      function packTwoNumbers(num1, num2) -> resultNumber {
        resultNumber := or(shl(BITS_COUNT_IN_16_BYTES, num1), num2)
      }
    }
  }

  function getValueForDataFeed(bytes32 dataFeedId) public view returns (uint256) {
    uint256 valueForDataFeed = getValueForDataFeedUnsafe(dataFeedId);
    validateDataFeedValue(dataFeedId, valueForDataFeed);
    return valueForDataFeed;
  }

  function getValuesForDataFeeds(bytes32[] memory requestedDataFeedIds)
    public
    view
    returns (uint256[] memory) {
      uint256[] memory values = getValuesForDataFeedUnsafe(requestedDataFeedIds);
      for (uint256 i = 0; i < requestedDataFeedIds.length; i++) {
        validateDataFeedValue(requestedDataFeedIds[i], values[i]);
      }
      return values;
    }

  function validateDataFeedValue(bytes32 dataFeedId, uint256 valueForDataFeed) public pure virtual {
    if (valueForDataFeed == 0) {
      revert DataFeedValueCannotBeZero(dataFeedId);
    }
  }

  function getValueForDataFeedUnsafe(bytes32 dataFeedId) public view virtual returns (uint256);

  function getValuesForDataFeedUnsafe(bytes32[] memory requestedDataFeedIds) public view virtual returns (uint256[] memory values) {
    values = new uint256[](requestedDataFeedIds.length);
    for (uint256 i = 0; i < requestedDataFeedIds.length; i++) {
      values[i] = getValueForDataFeedUnsafe(requestedDataFeedIds[i]);
    }
    return values;
  }
}
