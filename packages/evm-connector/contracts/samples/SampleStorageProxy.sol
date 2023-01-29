// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerNumericMock.sol";
import "./SampleStorageProxyConsumer.sol";

contract SampleStorageProxy is RedstoneConsumerNumericMock {
  SampleStorageProxyConsumer sampleContract;

  mapping(bytes32 => uint256) public oracleValues;

  function register(address _sampleContract) external {
    sampleContract = SampleStorageProxyConsumer(_sampleContract);
  }

  function fetchValueUsingProxyDryRun(bytes32 dataFeedId) public returns (uint256) {
    oracleValues[dataFeedId] = getOracleNumericValueFromTxMsg(dataFeedId);
    return sampleContract.getOracleValue(dataFeedId);
  }

  function saveOracleValueInContractStorage(bytes32 dataFeedId) public {
    oracleValues[dataFeedId] = getOracleNumericValueFromTxMsg(dataFeedId);
  }

  function saveOracleValuesInContractStorage(bytes32[] memory dataFeedIds) public {
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);
    for (uint256 i = 0; i < dataFeedIds.length; i++) {
      oracleValues[dataFeedIds[i]] = values[i];
    }
  }

  function getOracleValue(bytes32 dataFeedId) public view returns (uint256) {
    return oracleValues[dataFeedId];
  }

  function getOracleValues(bytes32[] memory dataFeedIds) public view returns (uint256[] memory) {
    uint256[] memory values = new uint256[](dataFeedIds.length);
    for (uint256 i = 0; i < dataFeedIds.length; i++) {
      values[i] = oracleValues[dataFeedIds[i]];
    }
    return values;
  }
}
