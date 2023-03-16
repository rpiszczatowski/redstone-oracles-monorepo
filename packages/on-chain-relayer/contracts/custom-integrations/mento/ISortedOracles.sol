// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.4;

import "./linkedlists/SortedLinkedListWithMedian.sol";

interface ISortedOracles {
  // function addOracle(address, address) external;

  // function removeOracle(address, address, uint256) external;

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

  // function isOldestReportExpired(address token) external view returns (bool, address);

  function numTimestamps(address) external view returns (uint256);

  // function medianRate(address) external view returns (uint256, uint256);

  // function numTimestamps(address) external view returns (uint256);

  // function medianTimestamp(address) external view returns (uint256);

  // function getOracles(address) external view returns (address[] memory);

  // function getTimestamps(
  //   address token
  // )
  //   external
  //   view
  //   returns (
  //     address[] memory,
  //     uint256[] memory,
  //     SortedLinkedListWithMedian.MedianRelation[] memory
  //   );
}
