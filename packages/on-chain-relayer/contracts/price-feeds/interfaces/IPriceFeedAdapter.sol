// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "../../core/IRedstoneAdapter.sol";

interface IPriceFeedAdapter is IRedstoneAdapter {
  function addDataFeedIdAndUpdateValues(bytes32 newDataFeedId, uint256 proposedTimestamp) external;

  function removeDataFeedId(bytes32 dataFeedId) external;
}
