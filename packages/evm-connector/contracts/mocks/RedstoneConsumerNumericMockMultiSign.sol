// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../core/RedstoneConsumerNumericBaseMultiSign.sol";
import "./AuthorisedMockSignersBase.sol";

contract RedstoneConsumerNumericMockMultiSign is RedstoneConsumerNumericBaseMultiSign, AuthorisedMockSignersBase {
  uint256 internal constant MIN_TIMESTAMP_MILLISECONDS = 1654353400000;

  error TimestampIsNotValid();

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 10;
  }

  function getAuthorisedSignerIndex(address signerAddress)
    public
    view
    virtual
    override
    returns (uint8)
  {
    return getAuthorisedMockSignerIndex(signerAddress);
  }

  function validateTimestamp(uint256 receivedTimestampMilliseconds) public view virtual override {
    if (receivedTimestampMilliseconds < MIN_TIMESTAMP_MILLISECONDS) {
      revert TimestampIsNotValid();
    }
  }
}
