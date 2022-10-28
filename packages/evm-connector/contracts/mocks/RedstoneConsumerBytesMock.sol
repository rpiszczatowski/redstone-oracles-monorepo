// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../core/RedstoneConsumerBytesBase.sol";
import "./AuthorisedMockSignersBase.sol";

contract RedstoneConsumerBytesMock is RedstoneConsumerBytesBase, AuthorisedMockSignersBase {
  string internal constant ERR_TIMESTAMP_IS_NOT_VALID = "Timestamp is not valid";

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 3;
  }

  function getAuthorisedSignerIndex(address _signerAddress)
    public
    view
    virtual
    override
    returns (uint8)
  {
    return getAuthorisedMockSignerIndex(_signerAddress);
  }

  function validateTimestamp(uint256 _receivedTimestamp) public view virtual override {
    require(_receivedTimestamp >= 1654353400000, ERR_TIMESTAMP_IS_NOT_VALID);
  }
}
