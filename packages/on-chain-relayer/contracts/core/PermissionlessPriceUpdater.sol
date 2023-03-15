// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

contract PermissionlessPriceUpdater {
  // TODO: maybe allocate a random but stable place in storage for those variables
  uint256 public lastRound = 0;
  uint256 public lastUpdateTimestampMilliseconds = 0;

  error ProposedTimestampMustBeNewerThanLastTimestamp(
    uint256 proposedTimestamp,
    uint256 lastUpdateTimestampMilliseconds
  );

  error DataPackageTimestampIsOlderThanProposedTimestamp(
    uint256 proposedTimestamp,
    uint256 receivedTimestampMilliseconds
  );

  function validateAndUpdateProposedRoundAndTimestamp(
    uint256 proposedRound,
    uint256 proposedTimestamp
  ) internal {
    validateProposedRound(proposedRound);
    validateProposedTimestamp(proposedTimestamp);
    lastRound = proposedRound;
    lastUpdateTimestampMilliseconds = proposedTimestamp;
  }

  function validateDataPackageTimestampAgainstProposedTimestamp(
    uint256 receivedTimestampMilliseconds
  ) public view {
    /* 
      Here lastUpdateTimestampMilliseconds is already updated inside updateDataFeedsValues
      after validation in valivalidateTimestampFromUser and equal to proposedTimestamp
    */
    if (receivedTimestampMilliseconds < lastUpdateTimestampMilliseconds) {
      revert DataPackageTimestampIsOlderThanProposedTimestamp(
        lastUpdateTimestampMilliseconds,
        receivedTimestampMilliseconds
      );
    }
  }

  // If the proposed round isn't valid it will stops the contract execution
  // TODO: add few words why we don't revert in this case
  // TODO: test if it works properly
  function validateProposedRound(uint256 proposedRound) internal view {
    if (!isProposedRoundValid(proposedRound)) {
      assembly {
        return(0, 0x20)
      }
    }
  }

  function validateProposedTimestamp(uint256 proposedTimestamp) internal view {
    if (proposedTimestamp <= lastUpdateTimestampMilliseconds) {
      revert ProposedTimestampMustBeNewerThanLastTimestamp(
        proposedTimestamp,
        lastUpdateTimestampMilliseconds
      );
    }
  }

  function isProposedRoundValid(uint256 proposedRound) private view returns (bool) {
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
