// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import "../core/RedstoneConsumerNumericBase.sol";

contract TwapsDemoConsumerBase is RedstoneConsumerNumericBase {
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
    if (_signerAddress == 0xAAb9568f7165E66AcaFF50B705C3f3e964cbD24f) {
      return 0;
    } else {
      revert("Signer is not authorised");
    }
  }
}
