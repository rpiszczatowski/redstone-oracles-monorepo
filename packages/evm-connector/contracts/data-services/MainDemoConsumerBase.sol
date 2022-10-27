// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "../core/RedstoneConsumerNumericBase.sol";

contract MainDemoConsumerBase is RedstoneConsumerNumericBase {
  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 1;
  }

  function getAuthorisedSignerIndex(address _signerAddress)
    public
    view
    virtual
    override
    returns (uint8)
  {
    if (_signerAddress == 0x0C39486f770B26F5527BBBf942726537986Cd7eb) {
      return 0;
    } else {
      revert("Signer is not authorised");
    }
  }
}
