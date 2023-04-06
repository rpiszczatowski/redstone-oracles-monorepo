// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@redstone-finance/evm-connector/contracts/mocks/AuthorisedMockSignersBase.sol";
import "../price-feeds/data-services/PriceFeedsAdapterWithRoundsMainDemo.sol";

contract PriceFeedsAdapterMock is PriceFeedsAdapterWithRoundsMainDemo, AuthorisedMockSignersBase {
  constructor(bytes32[] memory dataFeedsIds) PriceFeedsAdapterWithRoundsMainDemo(dataFeedsIds) {}

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 2;
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
}
