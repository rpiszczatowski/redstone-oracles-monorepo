// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../mocks/RedstoneConsumerNumericMock.sol";
import "./SampleContract.sol";
import "hardhat/console.sol";

contract SampleStorageProxy is RedstoneConsumerNumericMock {
  error UnexpectedOracleValue();
  error WrongValue();
  error ExpectedMsgValueToBePassed();
  error ExpectedMsgValueNotToBePassed();

  SampleContract sampleContract;

  uint256 someStorageVar = 0;
  mapping(bytes32 => uint256) public oracleValues;

  constructor() {
    sampleContract = new SampleContract(address(this));
  }

  function getOracleValueBenchmark(bytes32 dataFeedId) external {
    saveOracleValueInContractStorage(dataFeedId);
    uint256 value =  getOracleValueUsingProxy(dataFeedId);
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

  function getOracleValue(bytes32 dataFeedId) public view returns (uint256) {
    return oracleValues[dataFeedId];
  }

  function getOracleValueUsingProxy(bytes32 dataFeedId) public view returns (uint256) {
    return sampleContract.getValueForDataFeedId(dataFeedId);
  }

  function checkOracleValue(bytes32 dataFeedId, uint256 expectedValue) external view {
    uint256 oracleValue = getOracleValueUsingProxy(dataFeedId);
    if (oracleValue != expectedValue) {
      revert UnexpectedOracleValue();
    }
  }
}
