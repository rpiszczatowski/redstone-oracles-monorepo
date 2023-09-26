// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {MergedPriceFeedAndAdapterWithRounds} from "../with-rounds/MergedPriceFeedAndAdapterWithRounds.sol";
import {PrimaryProdAuthoriser} from "./PrimaryProdAuthoriser.sol";

abstract contract MergedPriceFeedAndAdapterPrimaryProdWithRounds is MergedPriceFeedAndAdapterWithRounds, PrimaryProdAuthoriser {
  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return getDefaultUniqueSignersThresholdForPrimaryProd();
  }

  function getAuthorisedSignerIndex(
    address signerAddress
  ) public view virtual override returns (uint8) {
    return getAuthorisedSignerIndexForPrimaryProd(signerAddress);
  }
}
