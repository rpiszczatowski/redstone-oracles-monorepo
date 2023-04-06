// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

interface IPermissionlessPriceUpdater {
  function getMinIntervalBetweenUpdates() external view returns (uint256);
  function validateProposedTimestamp(uint256 proposedTimestamp) external view;
  function getLastUpdateTimestamp() external view returns (uint256);
}
