import { Consola } from "consola";
import { assert, NumberLike } from "redstone-protocol/src/common/utils";

const logger = require("./logger")("utils/numbers") as Consola;

// This are minimal and maxima values which JS can process precisely
// process not precisely means 2 ** 64 < (2 ** 64) + 1 ===> FALSE
// the only other way to use precise numbers is to use something like BN.js

// 9007199254740991 2^53 − 1.
export const REDSTONE_MAX_NUMBER = Number.MAX_SAFE_INTEGER;

export const REDSTONE_MIN_NUMBER = 1e-14;
// santizeSourceValues;
export const REDSTONE_MAX_DECIMALS = 14;
const DIGIT_REGEXP = /^\d+(\.\d+)?$/;

/** Precise Number */
type SafeNumber = number;

const clamp = (number: number): SafeNumber => {
  if (number === Infinity) {
    return REDSTONE_MAX_NUMBER;
  }

  return number;
};

const assertSafeNumber = (number: SafeNumber): void => {
  assert(!Number.isNaN(number), "Invalid number format: number is NaN");
  assert(
    Number.isFinite(number),
    "Invalid number format: number is not finite"
  );
  assert(number >= 0, "Invalid number format: negative numbers are forbidden");

  if (number > REDSTONE_MAX_NUMBER) {
    throw Error(
      `Invalid number format: Number is bigger then max number acceptable by REDSTONE ${number}`
    );
  }
  if (number < REDSTONE_MIN_NUMBER && number !== 0) {
    throw Error(
      `Invalid number format: Number is smaller then min number acceptable by REDSTONE ${number}`
    );
  }
};

export const tryToParseToSafeNumber = (
  value: NumberLike
): { number: SafeNumber; isValid: boolean } => {
  try {
    return { number: parseToSafeNumber(value), isValid: true };
  } catch (e) {
    return { number: 0, isValid: false };
  }
};

export const parseToSafeNumber = (value: NumberLike): SafeNumber => {
  let number;
  if (typeof value === "string") {
    if (!DIGIT_REGEXP.test(value)) {
      throw Error(
        `Invalid number format, not matching regexp: ${DIGIT_REGEXP}`
      );
    }
    number = Number(Number(value).toFixed(REDSTONE_MAX_DECIMALS));
  } else if (typeof value !== "number") {
    throw Error(`Invalid number format, expected: string or number`);
  } else {
    number = Number(value.toFixed(REDSTONE_MAX_DECIMALS));
  }

  assertSafeNumber(number);

  return number;
};

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

export const calculateSum = (nums: number[]) =>
  nums.reduce((prev, cur) => prev + cur, 0);

export const calculateAverageValue = (nums: number[]): number => {
  if (nums.length === 0) {
    throw new Error("Can not calculate an average value for an empty array");
  }
  const result = clamp(calculateSum(nums) / nums.length);

  assertSafeNumber(result);

  return result;
};

export const calculateDeviationPercent = (args: {
  measuredValue: number;
  trueValue: number;
}) => {
  const { measuredValue, trueValue } = args;

  const secureTrueValue = trueValue === 0 ? Number.MIN_VALUE : trueValue;

  const result = clamp(
    Math.abs((measuredValue - trueValue) / secureTrueValue) * 100
  );

  assertSafeNumber(result);

  return result;
};
