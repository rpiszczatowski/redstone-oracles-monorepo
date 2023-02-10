// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../SampleRedstoneConsumerNumericMock.sol";

contract HashCalldataModel is RedstoneConsumerNumericMock {
  mapping(bytes32 => Request) public requests;
  uint256 price = 0;

  struct Request {
    bytes32 requestHash;
    uint256 blockNumber;
    address requesterAddress;
  }

  function sendRequestWith3Args(
    bytes32 arg1,
    bytes32 arg2,
    bytes32 arg3
  ) public returns (bytes32) {
    bytes32 requestHash = keccak256(abi.encodePacked(arg1, arg2, arg3));
    requests[requestHash] = Request(requestHash, block.number, msg.sender);
    return requestHash;
  }

  function sendRequestWith5Args(
    bytes32 arg1,
    bytes32 arg2,
    bytes32 arg3,
    bytes32 arg4,
    bytes32 arg5
  ) public returns (bytes32) {
    bytes32 requestHash = keccak256(abi.encodePacked(arg1, arg2, arg3, arg4, arg5));
    requests[requestHash] = Request(requestHash, block.number, msg.sender);
    return requestHash;
  }

  function sendRequestWith10Args(
    bytes32 arg1,
    bytes32 arg2,
    bytes32 arg3,
    bytes32 arg4,
    bytes32 arg5,
    bytes32 arg6,
    bytes32 arg7,
    bytes32 arg8,
    bytes32 arg9,
    bytes32 arg10
  ) public returns (bytes32) {
    bytes32 requestHash = keccak256(
      abi.encodePacked(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10)
    );
    requests[requestHash] = Request(requestHash, block.number, msg.sender);
    return requestHash;
  }

  function executeRequestWith3ArgsWithPrices(
    bytes32 arg1,
    bytes32 arg2,
    bytes32 arg3
  ) public {
    bytes32 requestHash = keccak256(abi.encodePacked(arg1, arg2, arg3));

    Request memory request = requests[requestHash];
    if (request.requestHash != 0) {
      price = getOracleNumericValueFromTxMsg(arg2);
    } else {
      revert("Request not found");
    }
  }

  function executeRequestWith5ArgsWithPrices(
    bytes32 arg1,
    bytes32 arg2,
    bytes32 arg3,
    bytes32 arg4,
    bytes32 arg5
  ) public {
    bytes32 requestHash = keccak256(abi.encodePacked(arg1, arg2, arg3, arg4, arg5));

    Request memory request = requests[requestHash];
    if (request.requestHash != 0) {
      price = getOracleNumericValueFromTxMsg(arg2);
    } else {
      revert("Request not found");
    }
  }

  function executeRequestWith10ArgsWithPrices(
    bytes32 arg1,
    bytes32 arg2,
    bytes32 arg3,
    bytes32 arg4,
    bytes32 arg5,
    bytes32 arg6,
    bytes32 arg7,
    bytes32 arg8,
    bytes32 arg9,
    bytes32 arg10
  ) public {
    bytes32 requestHash = keccak256(
      abi.encodePacked(arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8, arg9, arg10)
    );

    Request memory request = requests[requestHash];
    if (request.requestHash != 0) {
      price = getOracleNumericValueFromTxMsg(arg1);
    } else {
      revert("Request not found");
    }
  }

  function getUniqueSignersThreshold() public pure override returns (uint8) {
    return 3;
  }
}
