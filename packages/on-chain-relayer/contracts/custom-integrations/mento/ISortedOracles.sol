// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.4;

import "./linkedlists/SortedLinkedListWithMedian.sol";

interface ISortedOracles {
  function report(address, uint256, address, address) external;

  function removeExpiredReports(address, uint256) external;

  function getRates(
    address
  )
    external
    view
    returns (
      address[] memory,
      uint256[] memory,
      SortedLinkedListWithMedian.MedianRelation[] memory
    );

  function numTimestamps(address) external view returns (uint256);
}
