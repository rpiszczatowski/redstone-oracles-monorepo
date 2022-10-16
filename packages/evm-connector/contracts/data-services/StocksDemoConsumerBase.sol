// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "../core/RedstoneConsumerNumericBase.sol";

contract StocksDemoConsumerBase is RedstoneConsumerNumericBase {
  uint256 constant MAX_DATA_TIMESTAMP_DELAY_IN_SECONDS = 3 minutes;
  uint256 constant MAX_DATA_TIMESTAMP_AHEAD_IN_SECONDS = 1 minutes;

  constructor() {
    uniqueSignersThreshold = 1;
  }

  function getAuthorisedSignerIndex(address _signerAddress)
    public
    view
    virtual
    override
    returns (uint256)
  {
    if (_signerAddress == 0x926E370fD53c23f8B71ad2B3217b227E41A92b12) {
      return 0;
    } else {
      revert("Signer is not authorised");
    }
  }

  function isTimestampValid(uint256 _receivedTimestamp)
    public
    view
    virtual
    override
    returns (bool)
  {
    require(
      (block.timestamp + MAX_DATA_TIMESTAMP_AHEAD_IN_SECONDS) > _receivedTimestamp,
      "Data with future timestamps is not allowed"
    );
    require(
      block.timestamp < _receivedTimestamp ||
        block.timestamp - _receivedTimestamp < MAX_DATA_TIMESTAMP_DELAY_IN_SECONDS,
      "Data is too old"
    );

    return true;
  }
}
