// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@redstone-finance/evm-connector/contracts/data-services/MainDemoConsumerBase.sol";
import "./ISortedOracles.sol";
import "./MentoDataFeedsManager.sol";
import "../../core/PermissionlessPriceUpdater.sol";

contract MentoAdapter is MainDemoConsumerBase, PermissionlessPriceUpdater, MentoDataFeedsManager {
  uint256 private constant MAX_NUMBER_OF_REPORTS_TO_REMOVE = 100;

  // RedStone provides values with 8 decimals
  // Mento sorted oracles expect 24 decimals (24 - 8 = 16)
  uint256 private constant PRICE_MULTIPLIER = 1e16;

  ISortedOracles public sortedOracles;

  struct LocationInSortedLinkedList {
    address lesserKey;
    address greaterKey;
  }

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
    LocationInSortedLinkedList[] calldata locationsInSortedLinkedLists
  ) external {
    udpatePriceValues(proposedRound, proposedTimestamp, locationsInSortedLinkedLists);
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
    LocationInSortedLinkedList[] calldata locationsInSortedLinkedLists
  ) public {
    validateAndUpdateProposedRoundAndTimestamp(proposedRound, proposedTimestamp);

    uint256 dataFeedsCount = getDataFeedsCount();
    bytes32[] memory dataFeedIds = getDataFeedIds();
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);

    for (uint256 dataFeedIndex = 0; dataFeedIndex < dataFeedsCount; dataFeedIndex++) {
      bytes32 dataFeedId = dataFeedIds[dataFeedIndex];
      address tokenAddress = getTokenAddressByDataFeedId(dataFeedId);
      uint256 priceValue = values[dataFeedIndex] * PRICE_MULTIPLIER;
      LocationInSortedLinkedList memory location = locationsInSortedLinkedLists[dataFeedIndex];
      sortedOracles.report(tokenAddress, priceValue, location.lesserKey, location.greaterKey);
    }
  }
}
