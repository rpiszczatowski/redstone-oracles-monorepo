// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "../data-services/RedstoneDataServiceConsumer.sol";
import "../mocks/AuthorisedMockSignersBase.sol";

contract SampleRedstoneDataServiceConsumerMock is
  RedstoneDataServiceConsumer,
  AuthorisedMockSignersBase
{
  uint256 internal constant MIN_TIMESTAMP_MILLISECONDS = 1654353400000;
  uint256 public firstValue;
  uint256 public secondValue;

  error TimestampIsNotValid();

  function save2ValuesInStorage(bytes32[] calldata dataFeedIds) public {
    // Get oracle values
    uint256[] memory values = getOracleNumericValuesFromTxMsg(dataFeedIds);

    // Save values in contract state
    firstValue = values[0];
    secondValue = values[1];
  }

  function getDataServiceId() public view virtual override returns (string memory) {
    return "mock-data-service";
  }

  function getUniqueSignersThreshold() public view virtual override returns (uint8) {
    return 10;
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

  function validateTimestamp(uint256 receivedTimestampMilliseconds) public view virtual override {
    if (receivedTimestampMilliseconds < MIN_TIMESTAMP_MILLISECONDS) {
      revert TimestampIsNotValid();
    }
  }
}
