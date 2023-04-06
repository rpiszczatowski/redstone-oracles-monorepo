// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../PriceFeedsAdapterBase.sol";

abstract contract PriceFeedsAdapterWithRounds is PriceFeedsAdapterBase {
  bytes32 constant VALUES_MAPPING_STORAGE_LOCATION =
    0x4dd0c77efa6f6d590c97573d8c70b714546e7311202ff7c11c484cc841d91bfc; // keccak256("RedStone.oracleValuesMapping");
  bytes32 constant ROUND_TIMESTAMP_MAPPING_STORAGE_LOCATION =
    0x207e00944d909d1224f0c253d58489121d736649f8393199f55eecf4f0cf3eb0; // keccak256("RedStone.roundTimestampMapping");
  bytes32 constant LATEST_ROUND_ID_STORAGE_LOCATION =
    0xc68d7f1ee07d8668991a8951e720010c9d44c2f11c06b5cac61fbc4083263938; // keccak256("RedStone.latestRoundId");

  error RoundNotFound(uint256 roundId);

  function validateAndUpdateDataFeedValues(
    bytes32[] memory dataFeedsIdsArray,
    uint256[] memory values
  ) internal virtual override {
    incrementLatestRoundId();
    updateLatestRoundTimestamp(getLastUpdateTimestamp() / 1000);

    for (uint256 i = 0; i < dataFeedsIdsArray.length; i++) {
      bytes32 dataFeedId = dataFeedsIdsArray[i];
      updateDataFeedValue(dataFeedId, values[i]);
    }
  }

  function updateDataFeedValue(bytes32 dataFeedId, uint256 dataFeedValue)
    internal
    virtual
    override
  {
    assertNonZero(dataFeedId, dataFeedValue);
    bytes32 locationInStorage = getValueLocationInStorage(dataFeedId, getLatestRoundId());
    assembly {
      sstore(locationInStorage, dataFeedValue)
    }
  }

  function getValueForDataFeed(bytes32 dataFeedId)
    public
    view
    override
    returns (uint256 dataFeedValue)
  {
    return getValueForDataFeedAndRound(dataFeedId, getLatestRoundId());
  }

  function getValueForDataFeedAndRound(bytes32 dataFeedId, uint256 roundId)
    public
    view
    returns (uint256 dataFeedValue)
  {
    bytes32 locationInStorage = getValueLocationInStorage(dataFeedId, roundId);
    assembly {
      dataFeedValue := sload(locationInStorage)
    }
  }

  function getLatestRoundParams()
    public
    view
    returns (uint256 latestRoundId, uint256 latestRoundTimestamp)
  {
    latestRoundId = getLatestRoundId();
    latestRoundTimestamp = getRoundTimestamp(latestRoundId);
  }

  function getRoundData(bytes32 dataFeedId, uint256 roundId)
    public
    view
    returns (uint256 dataFeedValue, uint256 roundTimestamp)
  {
    if (roundId > getLatestRoundId() || roundId == 0) {
      revert RoundNotFound(roundId);
    }
    dataFeedValue = getValueForDataFeedAndRound(dataFeedId, roundId);
    roundTimestamp = getRoundTimestamp(roundId);
  }

  function getValueLocationInStorage(bytes32 dataFeedId, uint256 roundId)
    private
    pure
    returns (bytes32)
  {
    return keccak256(abi.encode(dataFeedId, roundId, VALUES_MAPPING_STORAGE_LOCATION));
  }

  function getRoundTimestampLocationInStorage(uint256 roundId) private pure returns (bytes32) {
    return keccak256(abi.encode(roundId, ROUND_TIMESTAMP_MAPPING_STORAGE_LOCATION));
  }

  function getLatestRoundId() public view returns (uint256 latestRoundId) {
    assembly {
      latestRoundId := sload(LATEST_ROUND_ID_STORAGE_LOCATION)
    }
  }

  function incrementLatestRoundId() private {
    uint256 latestRoundId = getLatestRoundId();
    assembly {
      sstore(LATEST_ROUND_ID_STORAGE_LOCATION, add(latestRoundId, 1))
    }
  }

  function getRoundTimestamp(uint256 roundId) public view returns (uint256 roundTimestamp) {
    bytes32 locationInStorage = getRoundTimestampLocationInStorage(roundId);
    assembly {
      roundTimestamp := sload(locationInStorage)
    }
  }

  function updateLatestRoundTimestamp(uint256 roundTimestamp) private {
    uint256 latestRoundId = getLatestRoundId();
    bytes32 locationInStorage = getRoundTimestampLocationInStorage(latestRoundId);
    assembly {
      sstore(locationInStorage, roundTimestamp)
    }
  }
}
