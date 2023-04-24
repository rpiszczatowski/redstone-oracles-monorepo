// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "../core/RedstoneConsumerNumericBase.sol";

abstract contract RedstoneDataServiceConsumer is RedstoneConsumerNumericBase {
  function getDataServiceId() public view virtual returns (string memory);
}
