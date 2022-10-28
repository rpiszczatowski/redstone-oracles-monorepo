// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.0;

import "./RedstoneConstants.sol";

/**
 * @title The base contract with the main logic of data extraction from calldata
 * @author The Redstone Oracles team
 * @dev This contract was created to reuse the same logic in the RedstoneConsumerBase
 * and the ProxyConnector contracts
 */
contract CalldataExtractor is RedstoneConstants {
  function _extractByteSizeOfUnsignedMetadata() internal pure returns (uint256) {
    // Using uint24, because unsigned metadata byte size number has 3 bytes
    uint24 unsignedMetadataByteSize;
    uint256 calldataSize = msg.data.length;
    require(
      REDSTONE_MARKER_BS + STANDARD_SLOT_BS <= calldataSize,
      "Calldata size is not big enough"
    );
    assembly {
      let calldataOffset := sub(calldataSize, REDSTONE_MARKER_BS)
      unsignedMetadataByteSize := calldataload(sub(calldataOffset, STANDARD_SLOT_BS))
    }
    uint256 calldataNegativeOffset = unsignedMetadataByteSize
      + UNSGINED_METADATA_BYTE_SIZE_BS
      + REDSTONE_MARKER_BS;
    require(
      calldataNegativeOffset + DATA_PACKAGES_COUNT_BS <= calldataSize,
      "Unsigned metadata byte size is incorrect"
    );
    return calldataNegativeOffset;
  }

  // We return uint16, because unsigned metadata byte size number has 2 bytes
  function _extractDataPackagesCountFromCalldata(uint256 calldataNegativeOffset)
    internal
    pure
    returns (uint16 dataPackagesCount)
  {
    require(calldataNegativeOffset + STANDARD_SLOT_BS <= msg.data.length,
      "Calldata size is not big enough");
    assembly {
      let calldataOffset := sub(calldatasize(), calldataNegativeOffset)
      dataPackagesCount := calldataload(sub(calldataOffset, STANDARD_SLOT_BS))
    }
    return dataPackagesCount;
  }

  function _extractDataPointValueAndDataFeedId(
    uint256 calldataNegativeOffsetForDataPackage,
    uint256 defaultDataPointValueByteSize,
    uint256 dataPointIndex
  ) internal pure virtual returns (bytes32 dataPointDataFeedId, uint256 dataPointValue) {
    uint256 calldataSize = msg.data.length;
    uint256 negativeOffsetToDataPoints = calldataNegativeOffsetForDataPackage + DATA_PACKAGE_WITHOUT_DATA_POINTS_BS;
    uint256 dataPointNegativeOffset = negativeOffsetToDataPoints + (1 + dataPointIndex)
      * (defaultDataPointValueByteSize + DATA_POINT_SYMBOL_BS);
    require(dataPointNegativeOffset <= calldataSize, "Calldata size is not big enough");
    assembly {
      let dataPointCalldataOffset := sub(
        calldataSize,
        dataPointNegativeOffset
      )
      dataPointDataFeedId := calldataload(dataPointCalldataOffset)
      dataPointValue := calldataload(add(dataPointCalldataOffset, DATA_POINT_SYMBOL_BS))
    }
  }

  function _extractDataPointsDetailsForDataPackage(uint256 calldataNegativeOffsetForDataPackage)
    internal
    pure
    returns (uint256 dataPointsCount, uint256 eachDataPointValueByteSize)
  {
    // Using uint24, because data points count byte size number has 3 bytes
    uint24 _dataPointsCount;

    // Using uint32, because data point value byte size has 4 bytes
    uint32 _eachDataPointValueByteSize;

    assembly {
      // Extract data points count
      let negativeCalldataOffset := add(calldataNegativeOffsetForDataPackage, SIG_BS)
      _dataPointsCount := extractFromCalldata(negativeCalldataOffset)

      // Extract each data point value size
      negativeCalldataOffset := add(negativeCalldataOffset, DATA_POINTS_COUNT_BS)
      _eachDataPointValueByteSize := extractFromCalldata(negativeCalldataOffset)

      function extractFromCalldata(negativeOffset) -> extractedValue {
        extractedValue := calldataload(sub(calldatasize(), add(negativeOffset, STANDARD_SLOT_BS)))
      }
    }

    // Prepare returned values
    dataPointsCount = _dataPointsCount;
    eachDataPointValueByteSize = _eachDataPointValueByteSize;
  }
}
