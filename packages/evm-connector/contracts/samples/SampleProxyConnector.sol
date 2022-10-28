// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../core/ProxyConnector.sol";
import "./SampleRedstoneConsumerNumericMock.sol";

/**
 * @title SampleProxyConnector
 * @dev An example of a contract that makes a call to a SampleRedstoneConsumerMock contract
 */
contract SampleProxyConnector is ProxyConnector {
  string internal constant ERR_UNEXPECTED_ORACLE_VALUE = "Received an unexpected oracle value";
  string internal constant ERR_WRONG_VALUE = "Wrong value!";
  string internal constant ERR_EXPECTED_MSG_VALUE_TO_BE_PASSED = "Expected msg.value to be passed";
  string internal constant ERR_EXPECTED_MSG_VALUE_NOT_TO_BE_PASSED =
    "Expected msg.value not to be passed";

  SampleRedstoneConsumerNumericMock sampleRedstoneConsumer;

  constructor() {
    sampleRedstoneConsumer = new SampleRedstoneConsumerNumericMock();
  }

  function getOracleValueUsingProxy(bytes32 dataFeedId) public view returns (uint256) {
    bytes memory encodedFunction = abi.encodeWithSelector(
      SampleRedstoneConsumerNumericMock.getValueForDataFeedId.selector,
      dataFeedId
    );

    bytes memory encodedResult = proxyCalldataView(
      address(sampleRedstoneConsumer),
      encodedFunction
    );

    return abi.decode(encodedResult, (uint256));
  }

  function checkOracleValue(bytes32 dataFeedId, uint256 expectedValue) external view {
    uint256 oracleValue = getOracleValueUsingProxy(dataFeedId);
    require(oracleValue == expectedValue, ERR_UNEXPECTED_ORACLE_VALUE);
  }

  function checkOracleValueLongEncodedFunction(bytes32 asset, uint256 price) external {
    bytes memory encodedFunction = abi.encodeWithSelector(
      SampleRedstoneConsumerNumericMock.getValueManyParams.selector,
      asset,
      115792089237316195423570985008687907853269984665640564039457584007913129639935,
      "long_string_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "long_string_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "long_string_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "long_string_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "long_string_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    );

    bytes memory encodedResult = ProxyConnector.proxyCalldata(
      address(sampleRedstoneConsumer),
      encodedFunction,
      false
    );

    uint256 oraclePrice = abi.decode(encodedResult, (uint256));

    require(oraclePrice == price, ERR_WRONG_VALUE);
  }

  function requireValueForward() external payable {
    bytes memory encodedFunction = abi.encodeWithSelector(
      SampleRedstoneConsumerNumericMock.returnMsgValue.selector
    );
    bytes memory encodedResult = ProxyConnector.proxyCalldata(
      address(sampleRedstoneConsumer),
      encodedFunction,
      false
    );
    uint256 msgValue = abi.decode(encodedResult, (uint256));

    require(msgValue == 0, ERR_EXPECTED_MSG_VALUE_NOT_TO_BE_PASSED);

    encodedResult = ProxyConnector.proxyCalldata(
      address(sampleRedstoneConsumer),
      encodedFunction,
      true
    );
    msgValue = abi.decode(encodedResult, (uint256));

    require(msgValue == msg.value, ERR_EXPECTED_MSG_VALUE_TO_BE_PASSED);
  }
}
