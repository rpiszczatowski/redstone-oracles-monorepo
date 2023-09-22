// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.14;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {RedstoneAdapterBase} from "../core/RedstoneAdapterBase.sol";

/**
 * @title Common logic of the price feed adapter contracts for only one symbol
 * @author The Redstone Oracles team
 */
abstract contract SinglePriceFeedAdapterBase is RedstoneAdapterBase, Initializable {

  error CannotUpdateMoreThanOneDataFeed();

  event AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 updatedAt);

  /**
   * @dev Helpful function for upgradable contracts
   */
  function initialize() public initializer {
    // We don't have storage variables, but we keep this function
    // Because it is used for contract setup in upgradable contracts
  }

  /**
   * @notice Returns the only data feed identifer supported by the adapter
   * @dev This function should be overriden in the final contract,
   * but `getDataFeedIds` and `getDataFeedIndex` should not (and can not)
   * @return dataFeedId The only data feed identifer supported by the adapter
   */
  function getSingleDataFeedId() public view virtual returns (bytes32);

  /**
   * @notice Returns identifiers of all data feeds supported by the Adapter contract
   * In this case - an array with only one element
   * @return dataFeedIds
   */
  function getDataFeedIds() public view virtual override returns (bytes32[] memory dataFeedIds) {
    dataFeedIds = new bytes32[](1);
    dataFeedIds[0] = getSingleDataFeedId();
  }

  /**
   * @dev Returns 0 if dataFeedId is the one, otherwise reverts
   * @param dataFeedId The identifier of the requested data feed
   */
  function getDataFeedIndex(bytes32 dataFeedId) public virtual view override returns(uint256) {
    if (dataFeedId == getSingleDataFeedId()) {
      return 0;
    }
    revert DataFeedIdNotFound(dataFeedId);
  }

  /**
   * @notice Returns latest successful round number
   * @dev for adapter without rounds it always returns 0
   * @return latestRoundId
   */
  function getLatestRoundId() public view virtual returns (uint256 latestRoundId);
  
  /**
   * @dev This function is virtual and may contain additional logic in the derived contract
   * E.g. it can check if the updating conditions are met (e.g. if at least one
   * value is deviated enough)
   * @param dataFeedIdsArray Array of all data feeds identifiers
   * @param values The reported values that are validated and reported
   */
  function _validateAndUpdateDataFeedsValues(
    bytes32[] memory dataFeedIdsArray,
    uint256[] memory values
  ) internal virtual override {
    if (dataFeedIdsArray.length != 1 || values.length != 1) {
      revert CannotUpdateMoreThanOneDataFeed();
    }
    _validateAndUpdateDataFeedValue(dataFeedIdsArray[0], values[0]);
    _emitEventAfterSingleValueUpdate(values[0]);
    
  }

  function _emitEventAfterSingleValueUpdate(uint256 newValue) internal virtual {
    // TODO: add a comment, how the ideal (but not cost-effective implementation would look like)
    emit AnswerUpdated(SafeCast.toInt256(newValue), getLatestRoundId(), block.timestamp);
  }

  /**
   * @dev Helpful virtual function for handling value validation and saving in derived
   * Price Feed Adapters contracts 
   * @param dataFeedId The data feed identifier
   * @param dataFeedValue Proposed value for the data feed
   */
  function _validateAndUpdateDataFeedValue(bytes32 dataFeedId, uint256 dataFeedValue) internal virtual;


  ////// FUNCTIONS FROM PRICE FEED //////

  /**
   * @notice Returns the number of decimals for the price feed
   * @dev By default, RedStone uses 8 decimals for data feeds
   * @return decimals The number of decimals in the price feed values
   */
  function decimals() public virtual pure returns (uint8) {
    return 8;
  }

  /**
   * @notice Description of the Price Feed
   * @return description
   */
  function description() public view virtual returns (string memory) {
    return "Redstone Price Feed";
  }

  /**
   * @notice Version of the Price Feed
   * @dev Currently it has no specific motivation and was added
   * only to be compatible with the Chainlink interface
   * @return version
   */
  function version() public virtual pure returns (uint256) {
    return 1;
  }
}
