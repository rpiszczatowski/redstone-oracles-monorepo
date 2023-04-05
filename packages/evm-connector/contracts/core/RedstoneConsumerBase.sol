// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./RedstoneConstants.sol";
import "./RedstoneDefaultsLib.sol";
import "./CalldataExtractor.sol";
import "../libs/BitmapLib.sol";
import "../libs/SignatureLib.sol";

/**
 * @title The base contract with the main Redstone logic
 * @author The Redstone Oracles team
 * @dev Do not use this contract directly in consumer contracts, take a
 * look at `RedstoneConsumerNumericBase` and `RedstoneConsumerBytesBase` instead
 */
abstract contract RedstoneConsumerBase is CalldataExtractor {
  using SafeMath for uint256;

  /* ========== VIRTUAL FUNCTIONS (MAY BE OVERRIDDEN IN CHILD CONTRACTS) ========== */

  /**
   * @dev This function must be implemented by the child consumer contract.
   * It should return a unique index for a given signer address if the signer
   * is authorised, otherwise it should revert
   * @param receivedSigner The address of a signer, recovered from ECDSA signature
   * @return Unique index for a signer in the range [0..255]
   */
  function getAuthorisedSignerIndex(address receivedSigner) public view virtual returns (uint8);

  /**
   * @dev This function may be overridden by the child consumer contract.
   * It should validate the timestamp against the current time (block.timestamp)
   * It should revert with a helpful message if the timestamp is not valid
   * @param receivedTimestampMilliseconds Timestamp extracted from calldata
   */
  function validateTimestamp(uint256 receivedTimestampMilliseconds) public view virtual {
    RedstoneDefaultsLib.validateTimestamp(receivedTimestampMilliseconds);
  }

  /**
   * @dev This function should be overridden by the child consumer contract.
   * @return The minimum required value of unique authorised signers
   */
  function getUniqueSignersThreshold() public view virtual returns (uint8) {
    return 1;
  }

  /**
   * @dev This function may be overridden by the child consumer contract.
   * It should aggregate values from different signers to a single uint value.
   * By default, it calculates the median value
   * @param values An array of uint256 values from different signers
   * @return Result of the aggregation in the form of a single number
   */
  function aggregateValues(uint256[] memory values) public view virtual returns (uint256) {
    return RedstoneDefaultsLib.aggregateValues(values);
  }

  /* ========== FUNCTIONS WITH IMPLEMENTATION (CAN NOT BE OVERRIDDEN) ========== */

  /**
   * @dev This function securely extracts and verifies oracle values from the calldata of a transaction.
   * It determines the version of the payload (single or multi-signature) based on the unsigned metadata in
   * the transaction calldata and calls the appropriate internal function to extract the oracle values.
   *
   * Note that this function should not be called from a consumer contract. Instead, use `getOracleNumericValuesFromTxMsg`
   * or `getOracleNumericValueFromTxMsg` as appropriate.
   *
   * @param dataFeedIds An array of unique data feed identifiers.
   * @return An array of the extracted and verified oracle values in the same order as the requested data feed identifiers.
   */
  function _securelyExtractOracleValuesFromTxMsg(
    bytes32[] memory dataFeedIds
  ) internal view returns (uint256[] memory) {
    // Attempt to extract version from unsigned metadata
    uint256 calldataNegativeOffset = _extractByteSizeOfUnsignedMetadata();
    uint256 version = _extractVersionFromUnsignedMetadata(calldataNegativeOffset);

    if (version == MULTISIGN_PAYLOAD_VERSION) {
      return _securelyExtractOracleValuesFromTxMsgMultiSign(dataFeedIds, calldataNegativeOffset);
    } else {
      return _securelyExtractOracleValuesFromTxMsgSingleSign(dataFeedIds, calldataNegativeOffset);
    }
  }

  /**
   * @dev This is an internal helpful function for secure extraction oracle values
   * from the tx calldata. Security is achieved by verifying signatures, validating
   * the timestamp, and ensuring a sufficient number of authorized signers have provided values.
   * If any of these conditions are not met, the function will revert.
   *
   * Note! You should not call this function in a consumer contract. You can use
   * `getOracleNumericValuesFromTxMsg` or `getOracleNumericValueFromTxMsg` instead.
   *
   * @param dataFeedIds An array of unique data feed identifiers
   * @param calldataNegativeOffset The offset from the end of calldata
   * @return An array of the extracted and verified oracle values in the same order
   * as they are requested in dataFeedIds array
   */
  function _securelyExtractOracleValuesFromTxMsgMultiSign(
    bytes32[] memory dataFeedIds,
    uint256 calldataNegativeOffset
  ) internal view returns (uint256[] memory) {
    calldataNegativeOffset += DATA_PACKAGES_COUNT_BS;
    uint256 signersCount = _extractDataPackageSignersCountFromCalldata(calldataNegativeOffset);

    calldataNegativeOffset += SIGNERS_COUNT_BS;
    uint256 signaturesByteSize = signersCount.mul(SIG_BS);

    (
      uint256 dataPointsCount,
      uint256 eachDataPointValueByteSize
    ) = _extractDataPointsDetailsForDataPackageMultiSign(
        calldataNegativeOffset + signaturesByteSize
      );

    uint256 uniqueSignersThreshold = getUniqueSignersThreshold();

    {
      bytes32 signedHash = _extractSignedHash(
        calldataNegativeOffset + signaturesByteSize,
        dataPointsCount,
        eachDataPointValueByteSize
      );

      _validateSignatures(
        signedHash,
        calldataNegativeOffset,
        signersCount,
        uniqueSignersThreshold
      );
    }

    _extractAndValidateTimestamp(calldataNegativeOffset + signaturesByteSize);

    // Extracting data points values
    {
      // Detects if all requested data feeds are present in the data package
      uint256 dataFeedsMatched = 0; 

      bytes32 dataPointDataFeedId;
      uint256 dataPointValue;
      uint256[] memory dataPointsValues = new uint256[](dataFeedIds.length);

      uint256 dataPointNegativeOffset = calldataNegativeOffset +
        signaturesByteSize +
        DATA_PACKAGE_WITHOUT_SIG_BS;

      for (uint256 dataPointIndex = 0; dataPointIndex < dataPointsCount; dataPointIndex++) {
        dataPointNegativeOffset =
          dataPointNegativeOffset +
          eachDataPointValueByteSize +
          DATA_POINT_SYMBOL_BS;

        (dataPointDataFeedId, dataPointValue) = _extractDataPointValueAndDataFeedIdMultiSign(
          dataPointNegativeOffset
        );

        for (uint256 i = 0; i < dataFeedIds.length; i++) {
          if (dataFeedIds[i] == dataPointDataFeedId) {
            dataFeedsMatched++;
            dataPointsValues[i] = dataPointValue;
            break;
          }
        }
      }

      if (dataFeedsMatched < dataFeedIds.length) {
        revert InsufficientNumberOfUniqueSigners(0, uniqueSignersThreshold);
      }

      return dataPointsValues;
    }
  }

  /**
   * @dev This internal function extracts the signed message from the transaction calldata, hashes it using
   * keccak256, and returns the resulting hash.
   *
   * Note that this function should not be called from a consumer contract. It is intended for internal use only.
   *
   * @param calldataNegativeOffset The negative offset of the transaction calldata.
   * @param dataPointsCount The number of data points in the data package.
   * @param eachDataPointValueByteSize The byte size of each data point value in the data package.
   * @return signedHash The keccak256 hash of the signed message extracted from the data package.
   */
  function _extractSignedHash(
    uint256 calldataNegativeOffset,
    uint256 dataPointsCount,
    uint256 eachDataPointValueByteSize
  ) internal pure returns (bytes32 signedHash) {
    bytes memory signedMessage;
    uint256 signedMessageBytesCount = dataPointsCount.mul(
      eachDataPointValueByteSize + DATA_POINT_SYMBOL_BS
    ) + DATA_PACKAGE_WITHOUT_DATA_POINTS_AND_SIG_BS; // DATA_POINT_VALUE_BYTE_SIZE_BS + TIMESTAMP_BS + DATA_POINTS_COUNT_BS

    uint256 signedMessageCalldataOffset = msg.data.length.sub(
      calldataNegativeOffset + signedMessageBytesCount
    );

    assembly {
      // Extracting the signed message
      signedMessage := extractBytesFromCalldata(
        signedMessageCalldataOffset,
        signedMessageBytesCount
      )

      // Hashing the signed message
      signedHash := keccak256(add(signedMessage, BYTES_ARR_LEN_VAR_BS), signedMessageBytesCount)

      function initByteArray(bytesCount) -> ptr {
        ptr := mload(FREE_MEMORY_PTR)
        mstore(ptr, bytesCount)
        ptr := add(ptr, BYTES_ARR_LEN_VAR_BS)
        mstore(FREE_MEMORY_PTR, add(ptr, bytesCount))
      }

      function extractBytesFromCalldata(offset, bytesCount) -> extractedBytes {
        let extractedBytesStartPtr := initByteArray(bytesCount)
        calldatacopy(extractedBytesStartPtr, offset, bytesCount)
        extractedBytes := sub(extractedBytesStartPtr, BYTES_ARR_LEN_VAR_BS)
      }
    }
  }

  /**
   * @dev This internal function extracts the timestamp from the transaction calldata, validates that it is within
   * an acceptable range based on the current block timestamp, and reverts the transaction if it is too old.
   *
   * Note that this function should not be called from a consumer contract. It is intended for internal use only.
   *
   * @param calldataNegativeOffset The negative offset of the transaction calldata.
   */
  function _extractAndValidateTimestamp(uint256 calldataNegativeOffset) internal view {
    uint256 timestampCalldataOffset = msg.data.length.sub(
      calldataNegativeOffset +
        DATA_POINT_VALUE_BYTE_SIZE_BS +
        DATA_POINTS_COUNT_BS +
        STANDARD_SLOT_BS
    );

    uint48 extractedTimestamp;
    assembly {
      extractedTimestamp := calldataload(timestampCalldataOffset)
    }

    validateTimestamp(extractedTimestamp);
  }

  /**
 * @dev This internal function validates the signatures of authorized signers for the transaction calldata
 * based on a given signed hash. It recovers the signer address from each signature in the calldata and checks
 * that the address is authorized. The function keeps track of the unique signers and reverts the transaction if
 * the number of unique signers is below a certain threshold. The signed hash, negative offset of the transaction
 * calldata, number of signers, and unique signers threshold are passed as parameters.
 *
 * Note that this function should not be called from a consumer contract. It is intended for internal use only.
 *
 * @param signedHash The keccak256 hash of the signed message in the transaction calldata.
 * @param calldataNegativeOffset The negative offset of the transaction calldata.
 * @param signersCount The number of authorized signers for the transaction.
 * @param uniqueSignersThreshold The minimum number of unique authorized signers required to validate the signatures.
 */
  function _validateSignatures(
    bytes32 signedHash,
    uint256 calldataNegativeOffset,
    uint256 signersCount,
    uint256 uniqueSignersThreshold
  ) internal view {
    uint256 uniqueSignersCount = 0;
    uint256 singersBitmap = 0;
    uint256 signatureCalldataOffset = calldataNegativeOffset += SIG_BS;

    for (uint256 i = 0; i < signersCount; i++) {
      address signerAddress = SignatureLib.recoverSignerAddress(
        signedHash,
        signatureCalldataOffset
      );
      uint256 signerIndex = getAuthorisedSignerIndex(signerAddress);

      if (!BitmapLib.getBitFromBitmap(singersBitmap, signerIndex)) {
        singersBitmap = BitmapLib.setBitInBitmap(singersBitmap, signerIndex);
        uniqueSignersCount++;
      }

      signatureCalldataOffset = signatureCalldataOffset += SIG_BS;
    }

    if (uniqueSignersCount < uniqueSignersThreshold) {
      revert InsufficientNumberOfUniqueSigners(uniqueSignersCount, uniqueSignersThreshold);
    }
  }

  /**
   * @dev This is an internal helpful function for secure extraction oracle values
   * from the tx calldata. Security is achieved by signatures verification, timestamp
   * validation, and aggregating values from different authorised signers into a
   * single numeric value. If any of the required conditions (e.g. too old timestamp or
   * insufficient number of authorised signers) do not match, the function will revert.
   *
   * Note! You should not call this function in a consumer contract. You can use
   * `getOracleNumericValuesFromTxMsg` or `getOracleNumericValueFromTxMsg` instead.
   *
   * @param dataFeedIds An array of unique data feed identifiers
   * @param calldataNegativeOffset The offset from the end of calldata
   * @return An array of the extracted and verified oracle values in the same order
   * as they are requested in dataFeedIds array
   */
  function _securelyExtractOracleValuesFromTxMsgSingleSign(
    bytes32[] memory dataFeedIds,
    uint256 calldataNegativeOffset
  ) internal view returns (uint256[] memory) {
    // Initializing helpful variables and allocating memory
    uint256[] memory uniqueSignerCountForDataFeedIds = new uint256[](dataFeedIds.length);
    uint256[] memory signersBitmapForDataFeedIds = new uint256[](dataFeedIds.length);
    uint256[][] memory valuesForDataFeeds = new uint256[][](dataFeedIds.length);
    for (uint256 i = 0; i < dataFeedIds.length; i++) {
      // The line below is commented because newly allocated arrays are filled with zeros
      // But we left it for better readability
      // signersBitmapForDataFeedIds[i] = 0; // <- setting to an empty bitmap
      valuesForDataFeeds[i] = new uint256[](getUniqueSignersThreshold());
    }
    
    // Extracting the number of data packages from calldata
    uint256 dataPackagesCount = _extractDataPackagesCountFromCalldata(calldataNegativeOffset);
    calldataNegativeOffset += DATA_PACKAGES_COUNT_BS;

    // Saving current free memory pointer
    uint256 freeMemPtr;
    assembly {
      freeMemPtr := mload(FREE_MEMORY_PTR)
    }

    // Data packages extraction in a loop
    for (uint256 dataPackageIndex = 0; dataPackageIndex < dataPackagesCount; dataPackageIndex++) {
      // Extract data package details and update calldata offset
      uint256 dataPackageByteSize = _extractDataPackage(
        dataFeedIds,
        uniqueSignerCountForDataFeedIds,
        signersBitmapForDataFeedIds,
        valuesForDataFeeds,
        calldataNegativeOffset
      );
      calldataNegativeOffset += dataPackageByteSize;

      // Shifting memory pointer back to the "safe" value
      assembly {
        mstore(FREE_MEMORY_PTR, freeMemPtr)
      }
    }

    // Validating numbers of unique signers and calculating aggregated values for each dataFeedId
    return _getAggregatedValues(valuesForDataFeeds, uniqueSignerCountForDataFeedIds);
  }

  /**
   * @dev This is a private helpful function, which extracts data for a data package based
   * on the given negative calldata offset, verifies them, and in the case of successful
   * verification updates the corresponding data package values in memory
   *
   * @param dataFeedIds an array of unique data feed identifiers
   * @param uniqueSignerCountForDataFeedIds an array with the numbers of unique signers
   * for each data feed
   * @param signersBitmapForDataFeedIds an array of signer bitmaps for data feeds
   * @param valuesForDataFeeds 2-dimensional array, valuesForDataFeeds[i][j] contains
   * j-th value for the i-th data feed
   * @param calldataNegativeOffset negative calldata offset for the given data package
   *
   * @return An array of the aggregated values
   */
  function _extractDataPackage(
    bytes32[] memory dataFeedIds,
    uint256[] memory uniqueSignerCountForDataFeedIds,
    uint256[] memory signersBitmapForDataFeedIds,
    uint256[][] memory valuesForDataFeeds,
    uint256 calldataNegativeOffset
  ) private view returns (uint256) {
    uint256 signerIndex;

    (
      uint256 dataPointsCount,
      uint256 eachDataPointValueByteSize
    ) = _extractDataPointsDetailsForDataPackage(calldataNegativeOffset);

    // We use scopes to resolve problem with too deep stack
    {
      uint48 extractedTimestamp;
      address signerAddress;
      bytes32 signedHash;
      bytes memory signedMessage;
      uint256 signedMessageBytesCount;

      signedMessageBytesCount = dataPointsCount.mul(eachDataPointValueByteSize + DATA_POINT_SYMBOL_BS) 
        + DATA_PACKAGE_WITHOUT_DATA_POINTS_AND_SIG_BS; // DATA_POINT_VALUE_BYTE_SIZE_BS + TIMESTAMP_BS + DATA_POINTS_COUNT_BS

      uint256 timestampCalldataOffset = msg.data.length.sub(
        calldataNegativeOffset + TIMESTAMP_NEGATIVE_OFFSET_IN_DATA_PACKAGE_WITH_STANDARD_SLOT_BS
      );

      uint256 signedMessageCalldataOffset = msg.data.length.sub(
        calldataNegativeOffset + SIG_BS + signedMessageBytesCount
      );

      assembly {
        // Extracting the signed message
        signedMessage := extractBytesFromCalldata(
          signedMessageCalldataOffset,
          signedMessageBytesCount
        )

        // Hashing the signed message
        signedHash := keccak256(add(signedMessage, BYTES_ARR_LEN_VAR_BS), signedMessageBytesCount)

        // Extracting timestamp
        extractedTimestamp := calldataload(timestampCalldataOffset)

        function initByteArray(bytesCount) -> ptr {
          ptr := mload(FREE_MEMORY_PTR)
          mstore(ptr, bytesCount)
          ptr := add(ptr, BYTES_ARR_LEN_VAR_BS)
          mstore(FREE_MEMORY_PTR, add(ptr, bytesCount))
        }

        function extractBytesFromCalldata(offset, bytesCount) -> extractedBytes {
          let extractedBytesStartPtr := initByteArray(bytesCount)
          calldatacopy(extractedBytesStartPtr, offset, bytesCount)
          extractedBytes := sub(extractedBytesStartPtr, BYTES_ARR_LEN_VAR_BS)
        }
      }

      // Validating timestamp
      validateTimestamp(extractedTimestamp);

      // Verifying the off-chain signature against on-chain hashed data
      signerAddress = SignatureLib.recoverSignerAddress(
        signedHash,
        calldataNegativeOffset + SIG_BS
      );
      signerIndex = getAuthorisedSignerIndex(signerAddress);
    }

    // Updating helpful arrays
    {
      bytes32 dataPointDataFeedId;
      uint256 dataPointValue;
      for (uint256 dataPointIndex = 0; dataPointIndex < dataPointsCount; dataPointIndex++) {
        // Extracting data feed id and value for the current data point
        (dataPointDataFeedId, dataPointValue) = _extractDataPointValueAndDataFeedId(
          calldataNegativeOffset,
          eachDataPointValueByteSize,
          dataPointIndex
        );

        for (
          uint256 dataFeedIdIndex = 0;
          dataFeedIdIndex < dataFeedIds.length;
          dataFeedIdIndex++
        ) {
          if (dataPointDataFeedId == dataFeedIds[dataFeedIdIndex]) {
            uint256 bitmapSignersForDataFeedId = signersBitmapForDataFeedIds[dataFeedIdIndex];

            if (
              !BitmapLib.getBitFromBitmap(bitmapSignersForDataFeedId, signerIndex) && /* current signer was not counted for current dataFeedId */
              uniqueSignerCountForDataFeedIds[dataFeedIdIndex] < getUniqueSignersThreshold()
            ) {
              // Increase unique signer counter
              uniqueSignerCountForDataFeedIds[dataFeedIdIndex]++;

              // Add new value
              valuesForDataFeeds[dataFeedIdIndex][
                uniqueSignerCountForDataFeedIds[dataFeedIdIndex] - 1
              ] = dataPointValue;

              // Update signers bitmap
              signersBitmapForDataFeedIds[dataFeedIdIndex] = BitmapLib.setBitInBitmap(
                bitmapSignersForDataFeedId,
                signerIndex
              );
            }

            // Breaking, as there couldn't be several indexes for the same feed ID
            break;
          }
        }
      }
    }

    // Return total data package byte size
    return
      DATA_PACKAGE_WITHOUT_DATA_POINTS_BS +
      (eachDataPointValueByteSize + DATA_POINT_SYMBOL_BS) *
      dataPointsCount;
  }

  /**
   * @dev This is a private helpful function, which aggregates values from different
   * authorised signers for the given arrays of values for each data feed
   *
   * @param valuesForDataFeeds 2-dimensional array, valuesForDataFeeds[i][j] contains
   * j-th value for the i-th data feed
   * @param uniqueSignerCountForDataFeedIds an array with the numbers of unique signers
   * for each data feed
   *
   * @return An array of the aggregated values
   */
  function _getAggregatedValues(
    uint256[][] memory valuesForDataFeeds,
    uint256[] memory uniqueSignerCountForDataFeedIds
  ) private view returns (uint256[] memory) {
    uint256[] memory aggregatedValues = new uint256[](valuesForDataFeeds.length);
    uint256 uniqueSignersThreshold = getUniqueSignersThreshold();

    for (uint256 dataFeedIndex = 0; dataFeedIndex < valuesForDataFeeds.length; dataFeedIndex++) {
      if (uniqueSignerCountForDataFeedIds[dataFeedIndex] < uniqueSignersThreshold) {
        revert InsufficientNumberOfUniqueSigners(
          uniqueSignerCountForDataFeedIds[dataFeedIndex],
          uniqueSignersThreshold
        );
      }
      uint256 aggregatedValueForDataFeedId = aggregateValues(valuesForDataFeeds[dataFeedIndex]);
      aggregatedValues[dataFeedIndex] = aggregatedValueForDataFeedId;
    }

    return aggregatedValues;
  }
}
