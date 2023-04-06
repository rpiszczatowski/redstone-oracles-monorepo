// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "../../core/IPermissionlessPriceUpdater.sol";

interface IPriceFeedAdapter is IPermissionlessPriceUpdater {
  function getDataFeedsIds() external view returns (bytes32[] memory);

  function addDataFeedIdAndUpdateValues(bytes32 newDataFeedId, uint256 proposedTimestamp) external;

  function removeDataFeedId(bytes32 dataFeedId) external;

  // Requires attached redstone payload in calldata
  function updateDataFeedsValues(uint256 proposedTimestamp) external;

  // Reads from adapter contract storage
  function getValueForDataFeed(bytes32 dataFeedId) external view returns (uint256);

  // Reads from adapter contract storage
  function getValuesForDataFeeds(bytes32[] memory requestedDataFeedsIds)
    external
    view
    returns (uint256[] memory);
}
