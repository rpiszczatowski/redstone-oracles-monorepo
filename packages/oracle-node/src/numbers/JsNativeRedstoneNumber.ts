import { Consola } from "consola";
import { assert, NumberLike } from "redstone-protocol/src/common/utils";
import { NumberArg, RedstoneNumber } from "./RedstoneNumber";

const logger = require("../utils/logger")(
  "numbers/JsNativeRedstoneNumber"
) as Consola;

enum NumberValidationResult {
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

export let JsNativeRedstoneNumberConfig = {
  MAX_NUMBER: Number.MAX_SAFE_INTEGER,
  MIN_NUMBER: 1e-14,
  MAX_DECIMALS: 14,
  DIGIT_REGEXP: /^[-+]?(\d+(\.\d{1,14})?)$/,
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

export const setJsNativeRedstoneNumberConfig = (
  newConfig: Partial<typeof JsNativeRedstoneNumberConfig>
): typeof JsNativeRedstoneNumberConfig => {
  const mergedConfig = {
    ...JsNativeRedstoneNumberConfig,
    ...newConfig,
  };
  JsNativeRedstoneNumberConfig = mergedConfig;
  return mergedConfig;
};

export class JsNativeRedstoneNumber implements RedstoneNumber {
  /** This method should only be called by factory {N} */
  static from(numberLike: NumberArg): JsNativeRedstoneNumber {
    if (numberLike instanceof JsNativeRedstoneNumber) {
      return new JsNativeRedstoneNumber(
        parseToSafeNumber(numberLike.toString())
      );
    } else if (
      typeof numberLike === "number" ||
      typeof numberLike === "string"
    ) {
      return new JsNativeRedstoneNumber(parseToSafeNumber(numberLike));
    } else {
      throw new Error(
        `Invalid number format: Tried to create JsNativeRedstoneNumber from ${numberLike}`
      );
    }
  }

  private _value: number;

  private constructor(value: number) {
    this._value = value;
    this.assertValidAndRound();
  }

  decimals(): number {
    return JsNativeRedstoneNumberConfig.MAX_DECIMALS;
  }

  toString(): string {
    return this._value.toString();
  }

  abs(): JsNativeRedstoneNumber {
    const result = Math.abs(this._value);
    return this.produceNewNumber(result);
  }

  add(numberLike: NumberArg): JsNativeRedstoneNumber {
    const result = this._value + JsNativeRedstoneNumber.from(numberLike)._value;

    return this.produceNewNumber(result);
  }

  sub(numberLike: NumberArg): JsNativeRedstoneNumber {
    const result = this._value - JsNativeRedstoneNumber.from(numberLike)._value;

    return this.produceNewNumber(result);
  }

  div(numberLike: NumberArg): JsNativeRedstoneNumber {
    const result = this._value / JsNativeRedstoneNumber.from(numberLike)._value;

    return this.produceNewNumber(result);
  }

  mul(numberLike: NumberArg): JsNativeRedstoneNumber {
    const result = this._value * JsNativeRedstoneNumber.from(numberLike)._value;

    return this.produceNewNumber(result);
  }

  assertNonNegative(): JsNativeRedstoneNumber {
    assert(this._value >= 0, `${this.toString} >= 0`);
    return this;
  }

  /** In the case of this implementation it is actually safe. */
  unsafeToNumber(): number {
    return this._value;
  }

  eq(numberArg: NumberArg): boolean {
    const number = JsNativeRedstoneNumber.from(numberArg);

    return (
      Math.abs(number.unsafeToNumber() - this.unsafeToNumber()) <
      JsNativeRedstoneNumberConfig.EPSILON
    );
  }

  lt(numberArg: NumberArg): boolean {
    return this._value < JsNativeRedstoneNumber.from(numberArg)._value;
  }

  lte(numberArg: NumberArg): boolean {
    return (
      this._value <=
      JsNativeRedstoneNumber.from(numberArg)._value +
        JsNativeRedstoneNumberConfig.EPSILON
    );
  }

  gt(numberArg: NumberArg): boolean {
    return this._value > JsNativeRedstoneNumber.from(numberArg)._value;
  }

  gte(numberArg: NumberArg): boolean {
    return (
      this._value >=
      JsNativeRedstoneNumber.from(numberArg)._value -
        JsNativeRedstoneNumberConfig.EPSILON
    );
  }

  toJSON(): number {
    return this.unsafeToNumber();
  }

  private produceNewNumber(result: number) {
    const newNumber = new JsNativeRedstoneNumber(result);
    newNumber.assertValidAndRound();
    return newNumber;
  }

  private assertValidAndRound() {
    const [validationResult, message] = validateNumber(this._value);

    if (validationResult !== NumberValidationResult.isOk) {
      JsNativeRedstoneNumberConfig.ON_NUMBER_VALIDATION_ERROR[validationResult](
        message
      );
    }

    this._value = Number(
      this._value.toFixed(JsNativeRedstoneNumberConfig.MAX_DECIMALS)
    );
  }
}

const validateNumber = (number: number): [NumberValidationResult, string] => {
  if (Number.isNaN(number)) {
    return [
      NumberValidationResult.isNaN,
      "Invalid number format: number is NaN",
    ];
  } else if (!Number.isFinite(number)) {
    return [
      NumberValidationResult.isNotFinite,
      "Invalid number format: number is not finite",
    ];
  }

  if (Math.abs(number) > JsNativeRedstoneNumberConfig.MAX_NUMBER) {
    return [
      NumberValidationResult.isOverflow,
      `Invalid number format: Number is bigger then max number acceptable by REDSTONE ${number}`,
    ];
  }
  if (
    Math.abs(number) < JsNativeRedstoneNumberConfig.MIN_NUMBER &&
    number !== 0
  ) {
    return [
      NumberValidationResult.isUnderflow,
      `Invalid number format: Number is smaller then min number acceptable by REDSTONE ${number}`,
    ];
  }

  return [NumberValidationResult.isOk, ""];
};

const parseToSafeNumber = (value: NumberLike) => {
  let number;
  if (typeof value === "string") {
    if (!JsNativeRedstoneNumberConfig.DIGIT_REGEXP.test(value)) {
      throw new Error(
        `Invalid number format, not matching regexp: ${JsNativeRedstoneNumberConfig.DIGIT_REGEXP}`
      );
    }
    number = Number(value);
  } else if (typeof value === "number") {
    number = Number(value);
  } else {
    throw new Error(`Invalid number format, expected: string or number`);
  }

  const [validationResult, message] = validateNumber(number);
  if (validationResult !== NumberValidationResult.isOk) {
    JsNativeRedstoneNumberConfig.ON_NUMBER_VALIDATION_ERROR[validationResult](
      message
    );
  }

  return number;
};
