// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import "../libs/NumericArrayLib.sol";

/**
 * @title Default implementations of virtual redstone consumer base functions
 * @author The Redstone Oracles team
 */
library RedstoneDefaultsLib {
  uint256 constant DEFAULT_MAX_DATA_TIMESTAMP_DELAY_SECONDS = 3 minutes;
  uint256 constant DEFAULT_MAX_DATA_TIMESTAMP_AHEAD_SECONDS = 1 minutes;

  function validateTimestamp(uint256 receivedTimestampMilliseconds) internal view {
    // Getting data timestamp from future seems quite unlikely
    // But we've already spent too much time with different cases
    // Where block.timestamp was less than dataPackage.timestamp.
    // Some blockchains may case this problem as well.
    // That's why we add MAX_BLOCK_TIMESTAMP_DELAY
    // and allow data "from future" but with a small delay
    uint256 receivedTimestampSeconds = receivedTimestampMilliseconds / 1000;
    uint256 timestampDiffSeconds = block.timestamp - receivedTimestampSeconds;
    bool isFromFuture = block.timestamp < receivedTimestampSeconds;

    require(
      (block.timestamp + DEFAULT_MAX_DATA_TIMESTAMP_AHEAD_SECONDS) > receivedTimestampSeconds,
      "Data with too future timestamps not allowed"
    );
    require(
      isFromFuture || timestampDiffSeconds < DEFAULT_MAX_DATA_TIMESTAMP_DELAY_SECONDS,
      "Timestamp is too old"
    );
  }

  function aggregateValues(uint256[] memory values) internal pure returns (uint256) {
    return NumericArrayLib.pickMedian(values);
  }
}
