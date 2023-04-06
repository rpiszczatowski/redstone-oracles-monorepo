// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "./IPermissionlessPriceUpdater.sol";

/**
 * @title Core logic of RedStone price updater contract
 * @author The Redstone Oracles team
 * @dev This contract is used to save RedStone data in blockchain
 * storage in a secure yet permissionless way. It allows anyone to
 * update prices in the contract storage in a round-based model
 */
contract PermissionlessPriceUpdater is IPermissionlessPriceUpdater {
  // We don't use storage variables to avoid potential problems with upgradable contracts
  bytes32 constant LAST_UPDATED_TIMESTAMP_STORAGE_LOCATION =
    0x3d01e4d77237ea0f771f1786da4d4ff757fcba6a92933aa53b1dcef2d6bd6fe2; // keccak256("RedStone.lastUpdateTimestamp");

  uint256 constant MIN_MILLISECONDS_INTERVAL_BETWEEN_UPDATES = 10_000;

  error ProposedTimestampMustBeNewerThanLastTimestamp(
    uint256 proposedTimestamp,
    uint256 lastUpdateTimestampMilliseconds
  );

  error MinIntervalBetweenUpdatesHasNotPassedYet(
    uint256 minIntervalBetweenUpdates,
    uint256 lastUpdateTimestampMilliseconds,
    uint256 proposedTimestamp
  );

  error DataPackageTimestampIsOlderThanProposedTimestamp(
    uint256 proposedTimestamp,
    uint256 receivedTimestampMilliseconds
  );

  error DataFeedValueCannotBeZero(bytes32 dataFeedId);

  // Note! This function must be called in a function for price updates
  // in a derived contract, before extracting oracles values
  function validateAndUpdateProposedTimestamp(uint256 proposedTimestamp) internal {
    validateProposedTimestamp(proposedTimestamp);
    setLastUpdateTimestamp(proposedTimestamp);
  }

  // Note! This function must be called in the overriden `validateTimestamp` function
  function validateDataPackageTimestampAgainstProposedTimestamp(
    uint256 receivedTimestampMilliseconds
  ) internal view virtual {
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

  function getMinIntervalBetweenUpdates() public view virtual returns (uint256) {
    return MIN_MILLISECONDS_INTERVAL_BETWEEN_UPDATES;
  }

  function validateProposedTimestampDefault(uint256 proposedTimestamp) internal view {
    uint256 lastUpdateTimestampMilliseconds = getLastUpdateTimestamp();

    if (proposedTimestamp <= lastUpdateTimestampMilliseconds) {
      revert ProposedTimestampMustBeNewerThanLastTimestamp(
        proposedTimestamp,
        getLastUpdateTimestamp()
      );
    } else if (
      proposedTimestamp - lastUpdateTimestampMilliseconds < getMinIntervalBetweenUpdates()
    ) {
      // TODO: think about it more, choose the better way

      // Option 1
      // Exit transaction without reverting, like process.exit() in Node.js
      // assembly {
      //   return(0, 0x20)
      // }

      // Option 2 (IMHO it's better)
      revert MinIntervalBetweenUpdatesHasNotPassedYet(
        getMinIntervalBetweenUpdates(),
        lastUpdateTimestampMilliseconds,
        proposedTimestamp
      );
    }
  }

  // Note! This function can be overriden for adding additional validation logic
  // e.g. for comparing proposed timestamp with the current block timestamp
  function validateProposedTimestamp(uint256 proposedTimestamp) public view virtual {
    validateProposedTimestampDefault(proposedTimestamp);
  }

  function getLastUpdateTimestamp() public view returns (uint256 lastUpdateTimestamp) {
    assembly {
      lastUpdateTimestamp := sload(LAST_UPDATED_TIMESTAMP_STORAGE_LOCATION)
    }
  }

  function setLastUpdateTimestamp(uint256 lastUpdateTimestampMilliseconds) private {
    assembly {
      sstore(LAST_UPDATED_TIMESTAMP_STORAGE_LOCATION, lastUpdateTimestampMilliseconds)
    }
  }

  // Helpful function, may be used in derived contracts
  function assertNonZero(bytes32 dataFeedId, uint256 receivedDataFeedValue) internal pure {
    if (receivedDataFeedValue == 0) {
      revert DataFeedValueCannotBeZero(dataFeedId);
    }
  }
}
