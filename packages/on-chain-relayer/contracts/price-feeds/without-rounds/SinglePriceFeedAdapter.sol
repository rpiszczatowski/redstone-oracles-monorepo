// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../PriceFeedsAdapterBase.sol";

abstract contract SinglePriceFeedAdapter is PriceFeedsAdapterBase {
  bytes32 internal constant DATA_FROM_LATEST_UPDATE_STORAGE_LOCATION =
    0x632f4a585e47073d66129e9ebce395c9b39d8a1fc5b15d4d7df2e462fb1fccfa; // keccak256("RedStone.singlePriceFeedAdapter");

  uint256 internal constant MAX_VALUE_WITH_20_BYTES = 0x00000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffff;

  error DataFeedValueTooBig(uint256 valueForDataFeed);

  function getSingleDataFeedId() public view virtual returns (bytes32);

  function getDataFeedIds() public view override returns (bytes32[] memory dataFeedIds) {
    dataFeedIds = new bytes32[](1);
    dataFeedIds[0] = getSingleDataFeedId();
  }

  function getDataFeedIndex(bytes32 dataFeedId) public view override returns(uint256) {
    if (dataFeedId == getSingleDataFeedId()) {
      return 0;
    }
    revert DataFeedIdNotFound(dataFeedId);
  }

  function validateDataFeedValue(bytes32 dataFeedId, uint256 valueForDataFeed) public pure virtual override {
    if (valueForDataFeed == 0) {
      revert DataFeedValueCannotBeZero(dataFeedId);
    }
    if (valueForDataFeed > MAX_VALUE_WITH_20_BYTES) {
      revert DataFeedValueTooBig(valueForDataFeed);
    }
  }

  function getValueForDataFeedUnsafe(bytes32) public view override returns (uint256 dataFeedValue) {
    uint192 dataFeedValueCompressed;
    assembly {
      dataFeedValueCompressed := sload(DATA_FROM_LATEST_UPDATE_STORAGE_LOCATION)
    }
    return uint256(dataFeedValueCompressed);
  }

  function getTimestampsFromLatestUpdate() public view override returns (uint128 dataTimestamp, uint128 blockTimestamp) {
    uint256 latestUpdateDetails;
    assembly {
      latestUpdateDetails := sload(LATEST_UPDATE_TIMESTAMPS_STORAGE_LOCATION)
    }
    dataTimestamp = uint128(latestUpdateDetails >> 208); // first 48 bits
    blockTimestamp = uint128((latestUpdateDetails << 48) >> 208); // next 48 bits
  }

  function _updateDataFeedValue(bytes32 dataFeedId, uint256 dataFeedValue) internal override {
    validateDataFeedValue(dataFeedId, dataFeedValue);
    assembly {
      sstore(DATA_FROM_LATEST_UPDATE_STORAGE_LOCATION, dataFeedValue)
    }
  }

  function _saveTimestampsOfCurrentUpdate(uint256 dataPackagesTimestamp) internal override {
    uint256 timestampsPacked = dataPackagesTimestamp << 208; // 48 first bits for dataPackagesTimestamp
    timestampsPacked |= (block.timestamp << 160); // 48 next bits for block.timestamp
    assembly {
      let latestUpdateDetails := sload(DATA_FROM_LATEST_UPDATE_STORAGE_LOCATION)
      latestUpdateDetails := and(latestUpdateDetails, MAX_VALUE_WITH_20_BYTES) // clear timestamp bits
      sstore(DATA_FROM_LATEST_UPDATE_STORAGE_LOCATION, or(latestUpdateDetails, timestampsPacked))
    }
  }
}
