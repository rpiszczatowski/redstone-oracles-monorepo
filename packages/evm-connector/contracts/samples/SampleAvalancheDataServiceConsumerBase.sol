// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../data-services/AvalancheDataServiceConsumerBase.sol";

contract SampleAvalancheDataServiceConsumerBase is AvalancheDataServiceConsumerBase {
  error TimestampIsNotValid();
  uint256 internal constant MIN_TIMESTAMP_MILLISECONDS = 1669799462727;
  uint256 public firstValue;
  uint256 public secondValue;

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 3;
  }

  function validateTimestamp(uint256 receivedTimestampMilliseconds) public view virtual override {
    if (receivedTimestampMilliseconds < MIN_TIMESTAMP_MILLISECONDS) {
      revert TimestampIsNotValid();
    }
  }

  function save2ValuesInStorage(bytes32[] calldata dataFeedIds) public {
    // Get oracle values
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);

    // Save values in contract state
    firstValue = values[0];
    secondValue = values[1];
  }
}
