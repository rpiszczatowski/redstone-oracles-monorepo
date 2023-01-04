// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./SampleStorageProxy.sol";

contract SampleContract {

  SampleStorageProxy sampleStorageProxy;
  
  constructor(address _sampleStorageProxy) {
    sampleStorageProxy = SampleStorageProxy(_sampleStorageProxy);
  }

  function getValueForDataFeedId(bytes32 dataFeedId) public view returns (uint256) {
    return sampleStorageProxy.getOracleValue(dataFeedId);
  }

  function getValuesForDataFeedIds(bytes32[] memory dataFeedIds) public view returns (uint256[] memory) {
    return sampleStorageProxy.getOracleValues(dataFeedIds);
  }
}
