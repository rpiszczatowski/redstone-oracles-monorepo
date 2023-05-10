import { Consola } from "consola";
import { BigNumber } from "ethers";
import { ISafeNumber } from "../numbers/ISafeNumber";
import { createSafeNumber } from "../numbers/SafeNumberFactory";

const logger = require("./logger")("utils/numbers") as Consola;

export const safelyConvertAnyValueToNumber = (value: any): number => {
  if (["string", "number"].includes(typeof value)) {
    return Number(value);
  } else {
    logger.warn(
      `Value can not be converted to a valid number. Received: ${value}`
    );
    return NaN;
  }
};

export const calculateSum = (numbers: ISafeNumber[]) =>
  numbers.reduce((prev, curr) => prev.add(curr), createSafeNumber(0));

export const calculateAverageValue = (nums: ISafeNumber[]): ISafeNumber => {
  if (nums.length === 0) {
    throw new Error("Can not calculate an average value for an empty array");
  }
  const result = calculateSum(nums).div(nums.length);

  return result;
};

export const calculateDeviationPercent = (args: {
  measuredValue: ISafeNumber;
  trueValue: ISafeNumber;
}) => {
  const { measuredValue, trueValue } = args;

  if (trueValue.eq(0)) {
    return createSafeNumber(Number.MAX_SAFE_INTEGER);
  }

  const result = measuredValue.sub(trueValue).div(trueValue).abs().mul(100);

  return result;
};

export function getMedianBigNumber(arr: BigNumber[]): BigNumber {
  if (arr.length === 0) {
    throw new Error("Cannot get median value of an empty array");
  }

  arr = arr.sort((a, b) => a.toNumber() - b.toNumber());

  const middle = Math.floor(arr.length / 2);

  if (arr.length % 2 === 0) {
    return arr[middle].add(arr[middle - 1]).div(2);
  } else {
    return arr[middle];
  }
}
