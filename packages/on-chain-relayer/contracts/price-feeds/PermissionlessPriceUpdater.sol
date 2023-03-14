// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "./CustomErrors.sol";

contract PermissionlessPriceUpdater {
  // TODO: maybe allocate a random but stable place in storage for those variables
  uint256 public lastRound = 0;
  uint256 public lastUpdateTimestampMilliseconds = 0;

  // TODO: improve the name of this function
  function validateTimestampComparingWothProposedTimestamp(
    uint256 receivedTimestampMilliseconds
  ) public view {
    /* 
      Here lastUpdateTimestampMilliseconds is already updated inside updateDataFeedsValues
      after validation in valivalidateTimestampFromUser and equal to proposedTimestamp
    */
    if (receivedTimestampMilliseconds < lastUpdateTimestampMilliseconds) {
      revert CustomErrors.ProposedTimestampDoesNotMatchReceivedTimestamp(
        lastUpdateTimestampMilliseconds,
        receivedTimestampMilliseconds
      );
    }
  }

  function validateProposedTimestamp(uint256 proposedTimestamp) internal view {
    if (proposedTimestamp <= lastUpdateTimestampMilliseconds) {
      revert CustomErrors.ProposedTimestampSmallerOrEqualToLastTimestamp(
        proposedTimestamp,
        lastUpdateTimestampMilliseconds
      );
    }
  }

  function isProposedRoundValid(uint256 proposedRound) internal view returns (bool) {
    return proposedRound == lastRound + 1;
  }

  function getLastRound() public view returns (uint256) {
    return lastRound;
  }

  function getLastUpdateTimestamp() public view returns (uint256) {
    return lastUpdateTimestampMilliseconds;
  }

  function getLastRoundParams() public view returns (uint256, uint256) {
    return (lastRound, lastUpdateTimestampMilliseconds);
  }
}
