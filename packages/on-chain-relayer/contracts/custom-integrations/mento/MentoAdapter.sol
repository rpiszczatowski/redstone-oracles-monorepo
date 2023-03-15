// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@redstone-finance/evm-connector/contracts/data-services/MainDemoConsumerBase.sol";
import "./ISortedOracles.sol";
import "./MentoDataFeedsManager.sol";
import "../../core/PermissionlessPriceUpdater.sol";

contract MentoAdapter is MainDemoConsumerBase, PermissionlessPriceUpdater, MentoDataFeedsManager {
  uint256 constant MAX_NUMBER_OF_REPORTS_TO_REMOVE = 100;

  ISortedOracles public sortedOracles;

  constructor(ISortedOracles sortedOracles_) {
    sortedOracles = sortedOracles_;
  }

  function validateTimestamp(uint256 receivedTimestampMilliseconds) public view override {
    RedstoneDefaultsLib.validateTimestamp(receivedTimestampMilliseconds);
    validateDataPackageTimestampAgainstProposedTimestamp(receivedTimestampMilliseconds);
  }

  // Helpful function to simplify mento-relayer code
  function updatePriceValueAndCleanOldReports(
    uint256 proposedRound,
    uint256 proposedTimestamp,
    address[] calldata lesserKeys,
    address[] calldata greaterKeys
  ) external {
    udpatePriceValues(proposedRound, proposedTimestamp, lesserKeys, greaterKeys);
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
    address[] calldata lesserKeys,
    address[] calldata greaterKeys
  ) public {
    validateAndUpdateProposedRoundAndTimestamp(proposedRound, proposedTimestamp);

    uint256 dataFeedsCount = getDataFeedsCount();
    bytes32[] memory dataFeedIds = getDataFeedIds();
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);

    for (uint256 dataFeedIndex = 0; dataFeedIndex < dataFeedsCount; dataFeedIndex++) {
      bytes32 dataFeedId = dataFeedIds[dataFeedIndex];
      address tokenAddress = getTokenAddressByDataFeedId(dataFeedId);
      address lesserKey = lesserKeys[dataFeedIndex];
      address greaterKey = greaterKeys[dataFeedIndex];
      uint256 priceValue = values[dataFeedIndex]; // TODO: think about decimals in the price values
      sortedOracles.report(tokenAddress, priceValue, lesserKey, greaterKey);
    }
  }
}
