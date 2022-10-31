// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../core/RedstoneConsumerNumericBase.sol";
import "./AuthorisedMockSignersBase.sol";

contract RedstoneConsumerNumericMock is RedstoneConsumerNumericBase, AuthorisedMockSignersBase {
  string internal constant ERR_TIMESTAMP_IS_NOT_VALID = "Timestamp is not valid";
  uint256 internal constant MIN_TIMESTAMP_MILLISECONDS = 1654353400000;

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
    require(
      receivedTimestampMilliseconds >= MIN_TIMESTAMP_MILLISECONDS,
      ERR_TIMESTAMP_IS_NOT_VALID
    );
  }
}
