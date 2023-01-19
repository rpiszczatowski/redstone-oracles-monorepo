// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

library NumericArrayLib {
  // This function sort array in memory using bubble sort algorithm,
  // which performs even better than quick sort for small arrays

  uint256 constant BYTES_ARR_LEN_VAR_BS = 32;
  uint256 constant UINT256_VALUE_BS = 32;

  error CanNotPickMedianOfEmptyArray();

  // This function modifies the array
  function pickMedian(uint256[] memory arr) internal pure returns (uint256) {
    if (arr.length == 0) {
      revert CanNotPickMedianOfEmptyArray();
    }
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

  function pickMedianLinear(uint256[] memory arr) internal pure returns (uint256) {
    if (arr.length == 0) {
      revert CanNotPickMedianOfEmptyArray();
    }

    if (arr.length == 1) {
      return arr[0];
    }

    uint256 n = arr.length;
    uint256 k = n / 2;

    uint256 left = 0;
    uint256 right = n - 1;

    bool found_prev = false;
    uint256 prev = 0;

    while (true) {
      uint256 i = partition(arr, left, right, right);

      // If (k-1)th elem is the pivot save it for later
      if (i == k - 1) {
        found_prev = true;
        prev = arr[i];
      }
      if (i == k) {
        right = i - 1; // right bound for k-1 search in even array case
        break;
      }
      if (i > k) {
        right = i - 1;
      } else {
        left = i + 1;
      }
    }

    if (arr.length % 2 == 1) {
      return arr[k];
    }

    if (found_prev) {
      return SafeMath.add(prev, arr[k]) / 2;
    }

    // k-1 was not the pivot case
    for (uint256 i = left; i <= right; i++) {
      if (arr[i] > prev) {
        prev = arr[i];
      }
    }

    return SafeMath.add(prev, arr[k]) / 2;
  }

  // Lomuto's partition algorithm. Modifies the array in place.
  function partition(
    uint256[] memory arr,
    uint256 lo,
    uint256 high,
    uint256 pivotIdx
  ) internal pure returns (uint256) {
    uint256 pivot = arr[pivotIdx];
    (arr[pivotIdx], arr[high]) = (arr[high], arr[pivotIdx]);
    uint256 i = lo;

    for (uint256 j = lo; j < high; j++) {
      if (arr[j] < pivot) {
        (arr[i], arr[j]) = (arr[j], arr[i]);
        i++;
      }
    }

    (arr[i], arr[high]) = (arr[high], arr[i]);
    return i;
  }
}
