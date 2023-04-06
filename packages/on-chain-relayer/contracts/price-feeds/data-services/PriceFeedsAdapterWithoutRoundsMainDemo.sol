// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../without-rounds/PriceFeedsAdapterWithoutRounds.sol";

contract PriceFeedsAdapterLiteMainDemo is PriceFeedsAdapterWithoutRounds {
  constructor(bytes32[] memory dataFeedsIds) PriceFeedsAdapterBase(dataFeedsIds) {}

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 1;
  }

  function getAuthorisedSignerIndex(address signerAddress)
    public
    view
    virtual
    override
    returns (uint8)
  {
    if (signerAddress == 0x0C39486f770B26F5527BBBf942726537986Cd7eb) {
      return 0;
    } else {
      revert SignerNotAuthorised(signerAddress);
    }
  }
}
