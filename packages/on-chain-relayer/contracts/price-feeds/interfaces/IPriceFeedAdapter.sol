// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../../core/IPermissionlessPriceUpdater.sol";

interface IPriceFeedAdapter is IPermissionlessPriceUpdater {
  // Data feed ids management
  function getDataFeedsIds() external view returns (bytes32[] memory);

  function addDataFeedIdAndUpdateValues(bytes32 newDataFeedId, uint256 proposedTimestamp) external;

  function removeDataFeedId(bytes32 dataFeedId) external;

  // Data feed values updating (requires attached redstone payload in calldata)
  function updateDataFeedsValues(uint256 proposedTimestamp) external;

  // Reading values from the adapter contract storage
  function getValueForDataFeed(bytes32 dataFeedId) external view returns (uint256);

  function getValuesForDataFeeds(bytes32[] memory requestedDataFeedsIds)
    external
    view
    returns (uint256[] memory);
}
