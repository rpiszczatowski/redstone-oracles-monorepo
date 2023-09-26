// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {PriceFeedBase, PriceFeedWithRounds} from "./PriceFeedWithRounds.sol";
import {PriceFeedsAdapterBase, PriceFeedsAdapterWithRounds} from "./PriceFeedsAdapterWithRounds.sol";
import {IRedstoneAdapter} from "../../core/IRedstoneAdapter.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";


// TODO:
// - fix the issue with initialize function
// - add aggregator function
// - add common interface for merged adapters to ensure that the one without rounds will implement all required functions
// - add NatSpec comments
// - maybe get rid of SafeCast
// - try to move common logic between with- and without- rounds versions
// - maybe add a logic for ensuring 1 feed and 1 value in _validateAndUpdateDataFeedsValues function
abstract contract MergedPriceFeedAndAdapterWithRounds is PriceFeedWithRounds, PriceFeedsAdapterWithRounds {

  event AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 updatedAt);

  /**
   * @dev Helpful function for upgradable contracts
   */
  function initialize() public override(PriceFeedBase, PriceFeedsAdapterBase) initializer {
    // We don't have storage variables, but we keep this function
    // Because it is used for contract setup in upgradable contracts
  }

  // TODO: maybe it can be moved to a common place
  function getPriceFeedAdapter() public view override returns (IRedstoneAdapter) {
    return IRedstoneAdapter(this);
  }

  // TODO: maybe it can be moved to a common place
  function aggregator() public view returns (address) {
    return address(getPriceFeedAdapter());
  }

  /**
   * @notice Returns the only data feed identifer supported by the adapter
   * @dev This function should be overriden in the final contract,
   * but `getDataFeedIds` and `getDataFeedIndex` should not (and can not)
   * @return dataFeedId The only data feed identifer supported by the adapter
   */
  function getSingleDataFeedId() public view virtual returns (bytes32);

  function getDataFeedIds() public view override returns (bytes32[] memory dataFeedIds) {
    dataFeedIds = new bytes32[](1);
    dataFeedIds[0] = getSingleDataFeedId();
  }

  function getDataFeedIndex(bytes32 dataFeedId) public view override returns(uint256) {
    if (dataFeedId == getSingleDataFeedId()) {
      return 0;
    }
    revert DataFeedIdNotFound(dataFeedId);
  }

  function _emitEventAfterSingleValueUpdate(uint256 newValue) internal virtual {
    emit AnswerUpdated(SafeCast.toInt256(newValue), getLatestRoundId(), block.timestamp);
  }

  function _validateAndUpdateDataFeedsValues(
    bytes32[] memory dataFeedIdsArray,
    uint256[] memory values
  ) internal virtual override {
    super._validateAndUpdateDataFeedsValues(dataFeedIdsArray, values);
    _emitEventAfterSingleValueUpdate(values[0]);
  }
}
