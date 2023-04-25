// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "@redstone-finance/evm-connector/contracts/mocks/AuthorisedMockSignersBase.sol";
import "../price-feeds/without-rounds/SinglePriceFeedAdapterWithClearing.sol";

contract SinglePriceFeedAdapterWithClearingMock is SinglePriceFeedAdapterWithClearing, AuthorisedMockSignersBase {
  function getSingleDataFeedId() public pure override returns (bytes32) {
    return bytes32("BTC");
  }

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 2;
  }

  function getAllowedTimestampDiffsInSeconds() public pure override returns (uint256 maxDataAheadSeconds, uint256 maxDataDelaySeconds) {
    maxDataAheadSeconds = 20 minutes;
    maxDataDelaySeconds = 20 minutes;
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
