// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Benchmark.sol";

contract BenchmarkWith300KBMemoryExpansion is Benchmark {
  uint256 internal constant BYTES_MEM_TO_USE = 300000;

  function extractOracleValues(bytes32[] calldata dataFeedIds) external override {
    allocateMemory(BYTES_MEM_TO_USE);
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);
    values;
    someStorageVar = 0;
  }

  // `emptyExtractOracleValues` is used to calculate gas costs for pure
  // calling the function and calculate the exact gas costs for getting
  // the oracle values
  function emptyExtractOracleValues(bytes32[] calldata dataFeedIds) external override {
    allocateMemory(BYTES_MEM_TO_USE);
    dataFeedIds;
    uint256[] memory values;
    values;
    someStorageVar = 0;
  }

  function allocateMemory(uint256 memoryBytesToUse) public pure {
    assembly {
      let curPtr := mload(FREE_MEMORY_PTR)
      mstore(FREE_MEMORY_PTR, add(curPtr, memoryBytesToUse))
    }
  }
}
