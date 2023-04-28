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
abstract contract RedstoneConsumerMultiSign is CalldataExtractor {
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

  /* ========== FUNCTIONS WITH IMPLEMENTATION (CAN NOT BE OVERRIDDEN) ========== */

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
    uint256 signersCount = _extractDataPackageSignersCountFromCalldata(calldataNegativeOffset);

    calldataNegativeOffset += MULTI_SIGNERS_COUNT_BS;
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

        for (uint256 requestedDataFeedId = 0; requestedDataFeedId < dataFeedIds.length; requestedDataFeedId++) {
          if (dataFeedIds[requestedDataFeedId] == dataPointDataFeedId) {
            dataFeedsMatched++;
            dataPointsValues[requestedDataFeedId] = dataPointValue;
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

    signedMessage = msg.data[signedMessageCalldataOffset:signedMessageCalldataOffset + signedMessageBytesCount];
    assembly {
      // Hashing the signed message
      signedHash := keccak256(add(signedMessage, BYTES_ARR_LEN_VAR_BS), signedMessageBytesCount)
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
}
