// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@redstone-finance/evm-connector/contracts/data-services/MainDemoConsumerBase.sol";
import "../../price-feeds/PermissionlessPriceUpdater.sol";

// TODO: separate common logic from PriceFeedsAdapter and reuse it here, e.g.
// - validateTimestamp
// - validateProposedTimestamp
// - isProposedRoundValid
// - getLastRound
// - getLastUpdateTimestamp
// - getLastRoundParams

contract MentoAdapter is MainDemoConsumerBase, PermissionlessPriceUpdater {
  uint lastValue;

  constructor(bytes32[] memory dataFeedsIds_) {
    dataFeedsIds_;
    lastValue = 42;
  }

  function validateTimestamp(uint256 receivedTimestampMilliseconds) public view override {
    RedstoneDefaultsLib.validateTimestamp(receivedTimestampMilliseconds);
    validateTimestampComparingWothProposedTimestamp(receivedTimestampMilliseconds);
  }

  function udpatePriceValuesAndCleanOld(
    uint256 proposedRound,
    uint256 proposedTimestamp,
    address leftKey,
    address rightKey
  ) external {
    proposedTimestamp;
    lastValue = 43;

    // TODO: implement
    // 1. Extract correct values from the calldata
    // 2. Check if the minimal timestamp is greater than the last update timestamp
    // 3. Update the values in mento sorted oracles
    // 4. Run cleaning of the outdated values
  }
}
