// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {MergedPriceFeedAndAdapterWithRounds} from "../with-rounds/MergedPriceFeedAndAdapterWithRounds.sol";

// TOOD: maybe add more, but I like this approach
// Hehe, added a smart way to avoid problems with new code
abstract contract MergedPriceFeedAndAdapterWithoutRounds is MergedPriceFeedAndAdapterWithRounds {
  function _incrementLatestRoundId() internal override {
    // Do nothing
  }
}
