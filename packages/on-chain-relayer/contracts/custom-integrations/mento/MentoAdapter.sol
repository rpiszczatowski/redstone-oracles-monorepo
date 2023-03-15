// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@redstone-finance/evm-connector/contracts/data-services/MainDemoConsumerBase.sol";
import "./ISortedOracles.sol";
import "./MentoDataFeedsManager.sol";
import "../../price-feeds/PermissionlessPriceUpdater.sol";

contract MentoAdapter is MainDemoConsumerBase, PermissionlessPriceUpdater, MentoDataFeedsManager {
  uint256 constant MAX_NUMBER_OF_REPORTS_TO_REMOVE = 100;

  ISortedOracles public sortedOracles;

  constructor(ISortedOracles sortedOraclesContractAddress) {
    sortedOracles = sortedOraclesContractAddress;
  }

  function validateTimestamp(uint256 receivedTimestampMilliseconds) public view override {
    RedstoneDefaultsLib.validateTimestamp(receivedTimestampMilliseconds);
    validateTimestampComparingWothProposedTimestamp(receivedTimestampMilliseconds);
  }

  // Helpful function to simplify mento-relayer code
  function updatePriceValueAndCleanOldReports(
    uint256 proposedRound,
    uint256 proposedTimestamp,
    address lesserKey,
    address greaterKey
  ) external {
    udpatePriceValues(proposedRound, proposedTimestamp, lesserKey, greaterKey);
    removeAllExpiredReports();
  }

  function removeAllExpiredReports() public {
    uint256 tokensLength = getDataFeedsCount();
    for (uint256 tokenIndex = 0; tokenIndex < tokensLength; tokenIndex++) {
      (, address tokenAddress) = getTokenDetailsAtIndex(tokenIndex);
      sortedOracles.removeExpiredReports(tokenAddress, MAX_NUMBER_OF_REPORTS_TO_REMOVE);
    }
  }

  function udpatePriceValues(
    uint256 proposedRound,
    uint256 proposedTimestamp,
    address lesserKey,
    address greaterKey
  ) public {
    // TODO: maybe we should refactor this peice of code as it's duplicated in PriceFeedsAdapter.sol
    if (!isProposedRoundValid(proposedRound)) return;
    lastRound = proposedRound;
    validateProposedTimestamp(proposedTimestamp);
    lastUpdateTimestampMilliseconds = proposedTimestamp;

    // TODO: implement price reporting

    // uint256 ethPrice = getOracleNumericValueFromTxMsg(ethToken);

    // sortedOracles.report(ethToken, ethPrice, lesserKey, greaterKey);

    // TODO: implement
    // 1. Extract correct values from the calldata
    // 2. Check if the minimal timestamp is greater than the last update timestamp
    // 3. Update the values in mento sorted oracles
    // 4. Run cleaning of the outdated values
  }
}
