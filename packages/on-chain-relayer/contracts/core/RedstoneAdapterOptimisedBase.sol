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
 * Key details about the contract:
 * - Values for data feeds can be updated using the `updateDataFeedsValues` function
 * - All data feeds must be updated within a single call, partial updates are not allowed
 * - There is a configurable minimum interval between updates
 * - Updaters can be restricted by overriding `requireAuthorisedUpdater` function
 * - The contract is designed to force values validation, by default it prevents returning zero values
 * - All data packages in redstone payload must have the same timestamp,
 *    equal to `dataPackagesTimestamp` argument of the `updateDataFeedsValues` function
 */
abstract contract RedstoneAdapterOptimisedBase is RedstoneConsumerNumericBase, IRedstoneAdapter {
  // We don't use storage variables to avoid potential problems with upgradable contracts
  bytes32 internal constant LATEST_UPDATE_TIMESTAMPS_STORAGE_LOCATION = 0x3d01e4d77237ea0f771f1786da4d4ff757fcba6a92933aa53b1dcef2d6bd6fe2; // keccak256("RedStone.lastUpdateTimestamp");
  uint256 internal constant MIN_INTERVAL_BETWEEN_UPDATES = 3 seconds;
  uint256 internal constant BITS_COUNT_IN_16_BYTES = 128;

  error DataTimestampShouldBeNewerThanBefore(
    uint256 receivedDataTimestampMilliseconds,
    uint256 lastDataTimestampMilliseconds
  );

  error MinIntervalBetweenUpdatesHasNotPassedYet(
    uint256 currentBlockTimestamp,
    uint256 lastUpdateTimestamp,
    uint256 minIntervalBetweenUpdates
  );

  error DataPackageTimestampMustNotBeZero();
  error DataPackageTimestampsMustBeEqual();

  error DataPackageTimestampMismatch(uint256 expectedDataTimestamp, uint256 dataPackageTimestamp);

  error DataFeedValueCannotBeZero(bytes32 dataFeedId);

  error DataFeedIdNotFound(bytes32 dataFeedId);

  function extractTimestampsAndAssertAllAreEqual() public pure returns (uint256 extractedTimestamp) {
    uint256 calldataNegativeOffset = _extractByteSizeOfUnsignedMetadata();
    uint256 dataPackagesCount = _extractDataPackagesCountFromCalldata(calldataNegativeOffset);
    calldataNegativeOffset += DATA_PACKAGES_COUNT_BS;

    for (uint256 dataPackageIndex = 0; dataPackageIndex < dataPackagesCount; dataPackageIndex++) {
      uint256 dataPackageByteSize = _getDataPackageByteSize(calldataNegativeOffset);

      // Extracting timestamp for the current data package
      uint48 dataPackageTimestamp; // uint48, because timestamp uses 6 bytes
      uint256 timestampNegativeOffset = (calldataNegativeOffset + SIG_BS + DATA_POINTS_COUNT_BS + DATA_POINT_VALUE_BYTE_SIZE_BS + STANDARD_SLOT_BS); // TODO: optimise using constant
      uint256 timestampOffset = msg.data.length - timestampNegativeOffset;
      assembly {
        dataPackageTimestamp := calldataload(timestampOffset)
      }

      if (dataPackageTimestamp == 0) {
        revert DataPackageTimestampMustNotBeZero();
      }

      if (extractedTimestamp == 0) {
        extractedTimestamp = dataPackageTimestamp;
      } else if (dataPackageTimestamp != extractedTimestamp) {
        revert DataPackageTimestampsMustBeEqual();
      }

      calldataNegativeOffset += dataPackageByteSize;
    }
  }

  function _getDataPackageByteSize(uint256 calldataNegativeOffset) internal pure returns (uint256) {
    (
      uint256 dataPointsCount,
      uint256 eachDataPointValueByteSize
    ) = _extractDataPointsDetailsForDataPackage(calldataNegativeOffset);

    return
      dataPointsCount *
      (DATA_POINT_SYMBOL_BS + eachDataPointValueByteSize) +
      DATA_PACKAGE_WITHOUT_DATA_POINTS_BS;
  }

  // This function should throw if msg.sender is not allowed to update data feed values
  // By default, anyone can update data feed values, but it can be overridden
  function requireAuthorisedUpdater(address updater) public view virtual {}

  function getDataFeedIds() public view virtual returns (bytes32[] memory) {
    return new bytes32[](0);
  }

  // This function can be overriden to reduce gas costs
  function getDataFeedIndex(bytes32 dataFeedId) public view virtual returns (uint256) {
    bytes32[] memory dataFeedIds = getDataFeedIds();
    for (uint256 i = 0; i < dataFeedIds.length; i++) {
      if (dataFeedIds[i] == dataFeedId) {
        return i;
      }
    }
    revert DataFeedIdNotFound(dataFeedId);
  }

  // This function requires redstone payload attached to the tx calldata
  function updateDataFeedsValues(uint256) public {
    requireAuthorisedUpdater(msg.sender);
    _assertMinIntervalBetweenUpdatesPassed();
    uint256 dataPackagesTimestamp = extractTimestampsAndAssertAllAreEqual();
    validateProposedDataPackagesTimestamp(dataPackagesTimestamp);
    _saveTimestampsOfCurrentUpdate(dataPackagesTimestamp);

    bytes32[] memory dataFeedsIdsArray = getDataFeedIds();

    // It will trigger timestamp validation for each data package
    uint256[] memory oracleValues = getOracleNumericValuesFromTxMsg(dataFeedsIdsArray);

    validateAndUpdateDataFeedsValues(dataFeedsIdsArray, oracleValues);
  }

  // We do nothing here, because the timestamp is already validate by
  // the `validateDataPackagesTimestampOnce` function
  function validateTimestamp(uint256 receivedTimestampMilliseconds) public view virtual override {}

  function validateAndUpdateDataFeedsValues(bytes32[] memory dataFeedIdsArray, uint256[] memory values) internal virtual;

  function _assertMinIntervalBetweenUpdatesPassed() private view {
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

  function validateProposedDataPackagesTimestamp(uint256 dataPackagesTimestamp) public view {
    preventUpdateWithOlderDataPackages(dataPackagesTimestamp);
    validateDataPackagesTimestampOnce(dataPackagesTimestamp);
  }

  function validateDataPackagesTimestampOnce(uint256 dataPackagesTimestamp) public view virtual {
    uint256 receivedTimestampSeconds = dataPackagesTimestamp / 1000;

    (uint256 maxDataAheadSeconds, uint256 maxDataDelaySeconds) = getAllowedTimestampDiffsInSeconds();

    if (block.timestamp < receivedTimestampSeconds) {
      if ((receivedTimestampSeconds - block.timestamp) > maxDataAheadSeconds) {
        revert RedstoneDefaultsLib.TimestampFromTooLongFuture(receivedTimestampSeconds, block.timestamp);
      }
    } else if ((block.timestamp - receivedTimestampSeconds) > maxDataDelaySeconds) {
      revert RedstoneDefaultsLib.TimestampIsTooOld(receivedTimestampSeconds, block.timestamp);
    }
  }

  function getAllowedTimestampDiffsInSeconds() public view virtual returns (uint256 maxDataAheadSeconds, uint256 maxDataDelaySeconds) {
    maxDataAheadSeconds = RedstoneDefaultsLib.DEFAULT_MAX_DATA_TIMESTAMP_AHEAD_SECONDS;
    maxDataDelaySeconds = RedstoneDefaultsLib.DEFAULT_MAX_DATA_TIMESTAMP_DELAY_SECONDS;
  }

  function preventUpdateWithOlderDataPackages(uint256 dataPackagesTimestamp) internal view {
    uint256 dataTimestampFromLatestUpdate = getDataTimestampFromLatestUpdate();

    if (dataPackagesTimestamp <= dataTimestampFromLatestUpdate) {
      revert DataTimestampShouldBeNewerThanBefore(
        dataPackagesTimestamp,
        dataTimestampFromLatestUpdate
      );
    }
  }

  function getDataTimestampFromLatestUpdate() public view virtual returns (uint256 lastDataTimestamp) {
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

  function getTimestampsFromLatestUpdate() public view virtual returns (uint128 dataTimestamp, uint128 blockTimestamp) {
    return _unpackTimestamps(getPackedTimestampsFromLatestUpdate());
  }

  function _unpackTimestamps(uint256 packedTimestamps) internal pure returns (uint128 dataTimestamp, uint128 blockTimestamp) {
    dataTimestamp = uint128(packedTimestamps >> 128); // first 128 bits
    blockTimestamp = uint128(packedTimestamps); // last 128 bits
  }

  function _saveTimestampsOfCurrentUpdate(uint256 dataPackagesTimestamp) internal virtual {
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
    getDataFeedIndex(dataFeedId); // will revert if data feed id is not supported
    uint256 valueForDataFeed = getValueForDataFeedUnsafe(dataFeedId);
    validateDataFeedValue(dataFeedId, valueForDataFeed);
    return valueForDataFeed;
  }

  function getValuesForDataFeeds(bytes32[] memory requestedDataFeedIds) public view returns (uint256[] memory) {
    uint256[] memory values = getValuesForDataFeedUnsafe(requestedDataFeedIds);
    for (uint256 i = 0; i < requestedDataFeedIds.length; i++) {
      bytes32 dataFeedId = requestedDataFeedIds[i];
      getDataFeedIndex(dataFeedId); // will revert if data feed id is not supported
      validateDataFeedValue(dataFeedId, values[i]);
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
