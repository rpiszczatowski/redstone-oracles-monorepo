// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

// TODO: add more description to this contract
// TODO: describe how it can be integrated to the new adapter
contract PermissionlessPriceUpdater {
  // We don't use storage variables to avoid problems with upgradable contracts
  uint256 constant LAST_ROUND_STORAGE_LOCATION =
    0x919ecb282edbbb41bface801311ec7a6df61da05d3d63b938d35b526a69d4d6d; // keccak256("RedStone.lastRound");
  uint256 constant LAST_UPDATED_TIMESTAMP_STORAGE_LOCATION =
    0x3d01e4d77237ea0f771f1786da4d4ff757fcba6a92933aa53b1dcef2d6bd6fe2; // keccak256("RedStone.lastUpdateTimestamp");

  // TODO: remove
  // uint256 public lastRound = 0;
  // uint256 public lastUpdateTimestampMilliseconds = 0;

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
    setLastRound(proposedRound);
    setLastUpdateTimestamp(proposedTimestamp);
  }

  function validateDataPackageTimestampAgainstProposedTimestamp(
    uint256 receivedTimestampMilliseconds
  ) public view {
    /* 
      Here lastUpdateTimestampMilliseconds is already updated by the
      validateAndUpdateProposedRoundAndTimestamp function and equals
      to the proposed timestamp
    */
    uint256 lastUpdateTimestampMilliseconds = getLastUpdateTimestamp();
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
    if (proposedTimestamp <= getLastUpdateTimestamp()) {
      revert ProposedTimestampMustBeNewerThanLastTimestamp(
        proposedTimestamp,
        getLastUpdateTimestamp()
      );
    }
  }

  function isProposedRoundValid(uint256 proposedRound) private view returns (bool) {
    return proposedRound == getLastRound() + 1;
  }

  function getLastRound() public view returns (uint256 lastRound) {
    assembly {
      lastRound := sload(LAST_ROUND_STORAGE_LOCATION)
    }
  }

  function getLastUpdateTimestamp() public view returns (uint256 lastUpdateTimestamp) {
    assembly {
      lastUpdateTimestamp := sload(LAST_UPDATED_TIMESTAMP_STORAGE_LOCATION)
    }
  }

  function setLastRound(uint256 lastRound) internal {
    assembly {
      sstore(LAST_ROUND_STORAGE_LOCATION, lastRound)
    }
  }

  function setLastUpdateTimestamp(uint256 lastUpdateTimestampMilliseconds) internal {
    assembly {
      sstore(LAST_UPDATED_TIMESTAMP_STORAGE_LOCATION, lastUpdateTimestampMilliseconds)
    }
  }

  function getLastRoundParams()
    public
    view
    returns (uint256 lastRound, uint256 lastUpdateTimestamp)
  {
    lastRound = getLastRound();
    lastUpdateTimestamp = getLastUpdateTimestamp();
  }
}
