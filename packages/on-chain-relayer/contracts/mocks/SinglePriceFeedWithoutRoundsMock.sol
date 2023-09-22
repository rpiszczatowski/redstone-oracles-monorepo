// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {IRedstoneAdapter} from "../core/IRedstoneAdapter.sol";
import {SinglePriceFeedWithoutRounds} from "../price-feeds/without-rounds/SinglePriceFeedWithoutRounds.sol";
import {SinglePriceFeedAdapterBase} from "../price-feeds/SinglePriceFeedAdapterBase.sol";

contract SinglePriceFeedWithoutRoundsMock is SinglePriceFeedWithoutRounds {
  address private adapterAddress;

  function setAdapterAddress(address _adapterAddress) public {
    adapterAddress = _adapterAddress;
  }

  function getPriceFeedAdapter() public view override returns (SinglePriceFeedAdapterBase) {
    return SinglePriceFeedAdapterBase(adapterAddress);
  }
}
