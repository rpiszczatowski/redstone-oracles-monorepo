// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {SinglePriceFeedAdapterPrimaryProdWithRounds} from "../data-services/SinglePriceFeedAdapterPrimaryProdWithRounds.sol";

contract SwethAdapterSample is SinglePriceFeedAdapterPrimaryProdWithRounds {
  error UpdaterNotAuthorised(address signer);

  function requireAuthorisedUpdater(address updater) public view override virtual {
    if (updater != 0x378AB7B007b0Cf1AF7E10b78F3287d6F2Bb4955F ) {
      revert UpdaterNotAuthorised(updater);
    }
  }

  function getSingleDataFeedId() public pure override returns (bytes32) {
    return bytes32("SWETH");
  }
}
