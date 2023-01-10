// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerNumericMock.sol";
import "./SampleContractUsingStorageProxy.sol";
import "hardhat/console.sol";

contract SampleStorageProxy is RedstoneConsumerNumericMock {
  error UnexpectedOracleValue();
  error WrongValue();
  error ExpectedMsgValueToBePassed();
  error ExpectedMsgValueNotToBePassed();

  SampleContractUsingStorageProxy sampleContract;

  uint256 someStorageVar = 0;
  mapping(bytes32 => uint256) public oracleValues;

  constructor() {
    sampleContract = new SampleContractUsingStorageProxy(address(this));
  }

  function getOracleValuesBenchmark(bytes32[] memory dataFeedIds) external {
    saveOracleValuesInContractStorage(dataFeedIds);
    uint256[] memory values = getOracleValuesUsingProxy(dataFeedIds);
    values;
    someStorageVar = 1;
  }

  function emptyGetOracleValuesBenchmark(bytes32[] memory dataFeedIds) external {
    dataFeedIds;
    uint256[] memory values;
    values;
    someStorageVar = 1;
  }

  function getOracleValueBenchmark(bytes32 dataFeedId) external {
    saveOracleValueInContractStorage(dataFeedId);
    uint256 value = getOracleValueUsingProxy(dataFeedId);
    value;
    someStorageVar = 1;
  }

  function emptyGetOracleValueBenchmark(bytes32 dataFeedId) external {
    dataFeedId;
    uint256 value;
    value;
    someStorageVar = 1;
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

  function getOracleValueUsingProxy(bytes32 dataFeedId) public view returns (uint256) {
    return sampleContract.getValueForDataFeedId(dataFeedId);
  }

  function getOracleValuesUsingProxy(bytes32[] memory dataFeedIds)
    public
    view
    returns (uint256[] memory)
  {
    return sampleContract.getValuesForDataFeedIds(dataFeedIds);
  }

  function checkOracleValue(bytes32 dataFeedId, uint256 expectedValue) external view {
    uint256 oracleValue = getOracleValueUsingProxy(dataFeedId);
    if (oracleValue != expectedValue) {
      revert UnexpectedOracleValue();
    }
  }

  function checkOracleValues(bytes32[] memory dataFeedIds, uint256[] memory expectedValues)
    external
    view
  {
    uint256[] memory values = getOracleValuesUsingProxy(dataFeedIds);
    for (uint256 i = 0; i < values.length; i++) {
      if (values[i] != expectedValues[i]) {
        revert UnexpectedOracleValue();
      }
    }
  }
}
