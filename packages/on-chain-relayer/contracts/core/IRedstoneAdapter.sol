// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

interface IRedstoneAdapter {
  // Requires attached redstone payload in calldata
  function updateDataFeedsValues(uint256 proposedTimestamp) external;

  // Reads from on-chain storage
  function getValueForDataFeed(bytes32 dataFeedId) external view returns (uint256);

  // Reads from on-chain storage
  function getValuesForDataFeeds(bytes32[] memory requestedDataFeedsIds)
    external
    view
    returns (uint256[] memory);

  function getDataFeedIds() external view returns (bytes32[] memory);

  function getMinIntervalBetweenUpdates() external view returns (uint256);

  function validateProposedTimestamp(uint256 proposedTimestamp) external view;

  function getLastUpdateTimestamp() external view returns (uint256);

  function requireAuthorisedUpdater(address updater) external view;
}
