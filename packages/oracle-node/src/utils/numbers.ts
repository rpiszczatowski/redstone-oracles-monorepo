import { Consola } from "consola";
import { ISafeNumber } from "../numbers/ISafeNumber";
import { SafeNumber } from "../numbers/SafeNumberFactory";

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
  numbers.reduce((prev, curr) => prev.add(curr), SafeNumber(0));

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
    // TODO: make it more generic
    return SafeNumber(Number.MAX_SAFE_INTEGER);
  }

  const result = measuredValue.sub(trueValue).div(trueValue).abs().mul(100);

  return result;
};
