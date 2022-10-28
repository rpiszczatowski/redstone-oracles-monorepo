// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

library NumericArrayLib {
  // This function sort array in memory using bubble sort algorithm,
  // which performs even better than quick sort for small arrays

  uint256 constant BYTES_ARR_LEN_VAR_BS = 32;
  uint256 constant UINT256_VALUE_BS = 32;

  string internal constant ERR_MEDIAN_IN_EMPTY_ARRAY = "Can't pick a median of an empty array";

  // This function modifies the array
  function pickMedian(uint256[] memory arr) internal pure returns (uint256) {
    require(arr.length > 0, ERR_MEDIAN_IN_EMPTY_ARRAY);
    sort(arr);
    uint256 middleIndex = arr.length / 2;
    if (arr.length % 2 == 0) {
      uint256 sum = SafeMath.add(arr[middleIndex - 1], arr[middleIndex]);
      return sum / 2;
    } else {
      return arr[middleIndex];
    }
  }

  function sort(uint256[] memory arr) internal pure {
    // solidityBubbleSort(arr);
    assemblyBubbleSort(arr);
  }

  function assemblyBubbleSort(uint256[] memory arr) internal pure {
    assembly {
      let arrLength := mload(arr)
      let valuesPtr := add(arr, BYTES_ARR_LEN_VAR_BS)
      let endPtr := add(valuesPtr, mul(arrLength, UINT256_VALUE_BS))
      for {
        let arrIPtr := valuesPtr
      } lt(arrIPtr, endPtr) {
        arrIPtr := add(arrIPtr, UINT256_VALUE_BS) // arrIPtr += 32
      } {
        for {
          let arrJPtr := valuesPtr
        } lt(arrJPtr, arrIPtr) {
          arrJPtr := add(arrJPtr, UINT256_VALUE_BS) // arrJPtr += 32
        } {
          let arrI := mload(arrIPtr)
          let arrJ := mload(arrJPtr)
          if lt(arrI, arrJ) {
            mstore(arrIPtr, arrJ)
            mstore(arrJPtr, arrI)
          }
        }
      }
    }
  }

  // We've commented the unused code below to optimise gas cost for deployment
  // function solidityBubbleSort(uint256[] memory arr) internal pure {
  //   for (uint256 i = 0; i < arr.length; i++) {
  //     for (uint256 j = 0; j < i; j++) {
  //       if (arr[i] < arr[j]) {
  //         (arr[i], arr[j]) = (arr[j], arr[i]);
  //       }
  //     }
  //   }
  // }
}
