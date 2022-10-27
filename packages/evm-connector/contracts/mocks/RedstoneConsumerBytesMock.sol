// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../core/RedstoneConsumerBytesBase.sol";
import "./AuthorisedMockSignersBase.sol";

contract RedstoneConsumerBytesMock is RedstoneConsumerBytesBase, AuthorisedMockSignersBase {
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
    require(_receivedTimestamp >= 1654353400000, "Timestamp is not valid");
  }
}
