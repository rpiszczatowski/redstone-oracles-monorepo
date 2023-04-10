// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "@redstone-finance/evm-connector/contracts/core/RedstoneConsumerNumericBase.sol";
import "./IRedstoneAdapter.sol";

/**
 * @title Core logic of RedStone Adapter Contract
 * @author The Redstone Oracles team
 * @dev This contract is used to save RedStone data in blockchain
 * storage in a secure yet permissionless way. It allows anyone to
 * update prices in the contract storage
 *
 * TODO: describe core principals of the contract
 * - min interval between updates in seconds (why and how it works)
 * - mechanism of proposed timestamps and requirement of the same timestamp in all data packages (why and how it works)
 * - mehcanism of whitelisted updaters (why and how it works)
 * - requirement of all data feeds updating in the same transaction (why and how it works)
 */
abstract contract RedstoneAdapterBase is RedstoneConsumerNumericBase, IRedstoneAdapter {
  // We don't use storage variables to avoid potential problems with upgradable contracts
  bytes32 constant private LATEST_UPDATE_TIMESTAMPS_STORAGE_LOCATION =
    0x3d01e4d77237ea0f771f1786da4d4ff757fcba6a92933aa53b1dcef2d6bd6fe2; // keccak256("RedStone.lastUpdateTimestamp");
  uint256 constant private MIN_INTERVAL_BETWEEN_UPDATES = 10 seconds;
  uint256 constant private BITS_COUNT_IN_16_BYTES = 128;


  error NotImplemented();

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

  // Anyone can update prices by default
  function requireAuthorisedUpdater(address updater) public view {}

  function getDataFeedIds() public view virtual returns (bytes32[] memory);

  // Important! Do not override this function in derived contrats
  function validateTimestamp(uint256 receivedTimestampMilliseconds) public view override {
    uint256 expectedDataPackageTimestamp = getDataTimestampFromLatestUpdate();
    if (receivedTimestampMilliseconds != expectedDataPackageTimestamp) {
      revert DataPackageTimestampMismatch(
        expectedDataPackageTimestamp,
        receivedTimestampMilliseconds
      );
    }
  }

  // This function required redstone payload attached to the tx calldata
  function updateDataFeedsValues(uint256 dataPackagesTimestamp) public {
    requireAuthorisedUpdater(msg.sender);
    validateCurrentBlockTimestamp();
    validateProposedDataPackagesTimestamp(dataPackagesTimestamp);
    saveTimestampsOfCurrentUpdate(dataPackagesTimestamp);

    bytes32[] memory dataFeedsIdsArray = getDataFeedIds();

    // It will trigger timestamp validation for each data package
    uint256[] memory oracleValues = getOracleNumericValuesFromTxMsg(dataFeedsIdsArray);

    validateAndUpdateDataFeedValues(dataFeedsIdsArray, oracleValues);
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
  // We strongly revcommend to not set it to 0, as it will open may attack vectors
  function getMinIntervalBetweenUpdates() public view virtual returns (uint256) {
    return MIN_INTERVAL_BETWEEN_UPDATES;
  }

  // Important! Be very careful with overriding this function
  function validateProposedDataPackagesTimestamp(uint256 dataPackagesTimestamp)
    public
    view
    virtual
  {
    requireFreshDataPackagesTimestamp(dataPackagesTimestamp);
    RedstoneDefaultsLib.validateTimestamp(dataPackagesTimestamp);
  }

  function requireFreshDataPackagesTimestamp(uint256 dataPackagesTimestamp) internal view {
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

  function saveTimestampsOfCurrentUpdate(uint256 dataPackagesTimestamp) private {
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

  function getValuesForDataFeeds(bytes32[] memory requestedDataFeedsIds)
    public
    view
    returns (uint256[] memory) {
      uint256[] memory values = getValuesForDataFeedUnsafe(requestedDataFeedsIds);
      for (uint256 i = 0; i < requestedDataFeedsIds.length; i++) {
        validateDataFeedValue(requestedDataFeedsIds[i], values[i]);
      }
      return values;
    }

  function validateDataFeedValue(bytes32 dataFeedId, uint256 valueForDataFeed) public pure virtual {
    if (valueForDataFeed == 0) {
      revert DataFeedValueCannotBeZero(dataFeedId);
    }
  }

  function getValueForDataFeedUnsafe(bytes32 dataFeedId) public view virtual returns (uint256);

  function getValuesForDataFeedUnsafe(bytes32[] memory requestedDataFeedsIds) public view virtual returns (uint256[] memory values) {
    values = new uint256[](requestedDataFeedsIds.length);
    for (uint256 i = 0; i < requestedDataFeedsIds.length; i++) {
      values[i] = getValueForDataFeedUnsafe(requestedDataFeedsIds[i]);
    }
    return values;
  }
}
