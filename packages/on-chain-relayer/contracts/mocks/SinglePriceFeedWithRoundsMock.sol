// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {IRedstoneAdapter} from "../core/IRedstoneAdapter.sol";
import {SinglePriceFeedWithRounds} from "../price-feeds/with-rounds/SinglePriceFeedWithRounds.sol";
import {SinglePriceFeedAdapterBase} from "../price-feeds/SinglePriceFeedAdapterBase.sol";

contract SinglePriceFeedWithRoundsMock is SinglePriceFeedWithRounds {
  address private adapterAddress;

  function setAdapterAddress(address _adapterAddress) public {
    adapterAddress = _adapterAddress;
  }

  function getPriceFeedAdapter() public view override returns (SinglePriceFeedAdapterBase) {
    return SinglePriceFeedAdapterBase(adapterAddress);
  }
}
