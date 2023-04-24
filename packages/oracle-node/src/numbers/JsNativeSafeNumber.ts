import { Consola } from "consola";
import { assert, NumberLike } from "redstone-protocol/src/common/utils";
import { NumberArg, ISafeNumber } from "./ISafeNumber";

const logger = require("../utils/logger")(
  "numbers/JsNativeSafeNumber"
) as Consola;

export enum NumberValidationResult {
  isOk = 0,
  isNaN,
  isNotFinite,
  isOverflow,
  isUnderflow,
}

export type NumberValidationError = Exclude<
  NumberValidationResult,
  NumberValidationResult.isOk
>;

export let JsNativeSafeNumberConfig = {
  MAX_NUMBER: Number.MAX_SAFE_INTEGER,
  MIN_NUMBER: 1e-14,
  MAX_DECIMALS: 14,
  DIGIT_REGEXP: /^[-+]?(\d+(\.\d{14})?)$/,
  ON_NUMBER_VALIDATION_ERROR: {
    [NumberValidationResult.isNaN]: (msg) => {
      throw new Error(msg);
    },
    [NumberValidationResult.isNotFinite]: (msg) => {
      throw new Error(msg);
    },
    [NumberValidationResult.isOverflow]: logger.error,
    [NumberValidationResult.isUnderflow]: logger.error,
  } as Record<NumberValidationError, (msg: string) => any>,
  EPSILON: 1e-14,
};

export const setJsNativeSafeNumberConfig = (
  newConfig: Partial<typeof JsNativeSafeNumberConfig>
): typeof JsNativeSafeNumberConfig => {
  const mergedConfig = {
    ...JsNativeSafeNumberConfig,
    ...newConfig,
  };
  JsNativeSafeNumberConfig = mergedConfig;
  return mergedConfig;
};

export class JsNativeSafeNumber implements ISafeNumber {
  /** This method should only be called by factory {N} */
  static from(numberLike: NumberArg): JsNativeSafeNumber {
    if (numberLike instanceof JsNativeSafeNumber) {
      return new JsNativeSafeNumber(numberLike._value);
    } else if (
      typeof numberLike === "number" ||
      typeof numberLike === "string"
    ) {
      return new JsNativeSafeNumber(parseToSafeNumber(numberLike));
    } else {
      throw new Error(
        `Invalid number format: Tried to create JsNativeSafeNumber from ${numberLike}`
      );
    }
  }

  private _value: number;

  private constructor(value: number) {
    this._value = value;
  }

  decimals(): number {
    return JsNativeSafeNumberConfig.MAX_DECIMALS;
  }

  toString(): string {
    return this._value.toString();
  }

  abs(): JsNativeSafeNumber {
    const result = Math.abs(this._value);
    return this.produceNewNumber(result);
  }

  add(numberLike: NumberArg): JsNativeSafeNumber {
    const result = this._value + JsNativeSafeNumber.from(numberLike)._value;

    return this.produceNewNumber(result);
  }

  sub(numberLike: NumberArg): JsNativeSafeNumber {
    const result = this._value - JsNativeSafeNumber.from(numberLike)._value;

    return this.produceNewNumber(result);
  }

  div(numberLike: NumberArg): JsNativeSafeNumber {
    const result = this._value / JsNativeSafeNumber.from(numberLike)._value;

    return this.produceNewNumber(result);
  }

  mul(numberLike: NumberArg): JsNativeSafeNumber {
    const result = this._value * JsNativeSafeNumber.from(numberLike)._value;

    return this.produceNewNumber(result);
  }

  assertNonNegative(): JsNativeSafeNumber {
    assert(this._value >= 0, `${this.toString} >= 0`);
    return this;
  }

  /** In the case of this implementation it is actually safe. */
  unsafeToNumber(): number {
    return this._value;
  }

  eq(numberArg: NumberArg): boolean {
    const number = JsNativeSafeNumber.from(numberArg);

    return (
      Math.abs(number._value - this._value) < JsNativeSafeNumberConfig.EPSILON
    );
  }

  lt(numberArg: NumberArg): boolean {
    return this._value < JsNativeSafeNumber.from(numberArg)._value;
  }

  lte(numberArg: NumberArg): boolean {
    return (
      this._value <=
      JsNativeSafeNumber.from(numberArg)._value +
        JsNativeSafeNumberConfig.EPSILON
    );
  }

  gt(numberArg: NumberArg): boolean {
    return this._value > JsNativeSafeNumber.from(numberArg)._value;
  }

  gte(numberArg: NumberArg): boolean {
    return (
      this._value >=
      JsNativeSafeNumber.from(numberArg)._value -
        JsNativeSafeNumberConfig.EPSILON
    );
  }

  toJSON(): number {
    return this.unsafeToNumber();
  }

  private produceNewNumber(result: number) {
    const newNumber = new JsNativeSafeNumber(result);
    newNumber.assertValidAndRound();
    return newNumber;
  }

  private assertValidAndRound() {
    const { result: validationResult, message } = validateNumber(this._value);

    if (validationResult !== NumberValidationResult.isOk) {
      JsNativeSafeNumberConfig.ON_NUMBER_VALIDATION_ERROR[validationResult](
        message
      );
    }

    this._value = Number(
      this._value.toFixed(JsNativeSafeNumberConfig.MAX_DECIMALS)
    );
  }
}

const validateNumber = (
  number: number
): { result: NumberValidationResult; message: string } => {
  if (Number.isNaN(number)) {
    return {
      result: NumberValidationResult.isNaN,
      message: "Invalid number format: number is NaN",
    };
  } else if (!Number.isFinite(number)) {
    return {
      result: NumberValidationResult.isNotFinite,
      message: "Invalid number format: number is not finite",
    };
  }

  if (Math.abs(number) > JsNativeSafeNumberConfig.MAX_NUMBER) {
    return {
      result: NumberValidationResult.isOverflow,
      message: `Invalid number format: Number is bigger then max number acceptable by REDSTONE ${number}`,
    };
  }
  if (Math.abs(number) < JsNativeSafeNumberConfig.MIN_NUMBER && number !== 0) {
    return {
      result: NumberValidationResult.isUnderflow,
      message: `Invalid number format: Number is smaller then min number acceptable by REDSTONE ${number}`,
    };
  }

  return { result: NumberValidationResult.isOk, message: "" };
};

const parseToSafeNumber = (value: NumberLike) => {
  let number;
  if (typeof value === "string") {
    if (!JsNativeSafeNumberConfig.DIGIT_REGEXP.test(value)) {
      logger.warn(
        `Invalid number format: ${number}, not matching regexp: ${JsNativeSafeNumberConfig.DIGIT_REGEXP}`
      );
    }
    number = Number(value);
  } else if (typeof value === "number") {
    number = Number(value);
  } else {
    throw new Error(`Invalid number format, expected: string or number`);
  }

  const { result: validationResult, message } = validateNumber(number);
  if (validationResult !== NumberValidationResult.isOk) {
    JsNativeSafeNumberConfig.ON_NUMBER_VALIDATION_ERROR[validationResult](
      message
    );
  }

  return number;
};
