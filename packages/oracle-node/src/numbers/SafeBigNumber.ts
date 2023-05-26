import { BigNumber, BigNumberish } from "ethers";
import { utils } from "redstone-protocol";
import { ISafeNumber, NumberArg } from "./ISafeNumber";

export class SafeBigNumber implements ISafeNumber {
  _value: BigNumber;
  _decimals: number;

  constructor(value: BigNumber, decimals: number) {
    this._value = value;
    this._decimals = decimals;
  }

  static from(
    bigNumberLike: BigNumberish | SafeBigNumber,
    decimals: number
  ): SafeBigNumber {
    if (bigNumberLike instanceof SafeBigNumber) {
      return new SafeBigNumber(bigNumberLike._value, bigNumberLike._decimals);
    } else if (
      typeof bigNumberLike === "string" ||
      typeof bigNumberLike === "number" ||
      typeof bigNumberLike === "bigint" ||
      bigNumberLike instanceof BigNumber
    ) {
      return new SafeBigNumber(BigNumber.from(bigNumberLike), decimals);
    } else {
      throw new Error(
        `Invalid BigNumberish format: Tried to create SafeBigNumber from ${bigNumberLike}`
      );
    }
  }

  abs(): SafeBigNumber {
    return new SafeBigNumber(this._value.abs(), this._decimals);
  }

  add(other: NumberArg): SafeBigNumber {
    return new SafeBigNumber(this._value.add(other.toString()), this._decimals);
  }

  sub(other: NumberArg): SafeBigNumber {
    return new SafeBigNumber(this._value.sub(other.toString()), this._decimals);
  }

  div(other: NumberArg): SafeBigNumber {
    return new SafeBigNumber(this._value.div(other.toString()), this._decimals);
  }

  mul(other: NumberArg): SafeBigNumber {
    return new SafeBigNumber(this._value.mul(other.toString()), this._decimals);
  }

  eq(other: NumberArg): boolean {
    return this._value.eq(other.toString());
  }

  lt(other: NumberArg): boolean {
    return this._value.lt(other.toString());
  }

  lte(other: NumberArg): boolean {
    return this._value.lte(other.toString());
  }

  gt(other: NumberArg): boolean {
    return this._value.gt(other.toString());
  }

  gte(other: NumberArg): boolean {
    return this._value.gte(other.toString());
  }

  assertNonNegative() {
    utils.assert(
      !this._value.isNegative(),
      `${this._value.toString()} is smaller than 0`
    );
  }

  unsafeToNumber() {
    return this._value.toNumber();
  }

  toBigNumber() {
    return this._value;
  }

  decimals(): number {
    return this._decimals;
  }
}
