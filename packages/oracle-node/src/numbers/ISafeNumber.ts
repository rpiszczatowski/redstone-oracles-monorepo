import { utils } from "redstone-protocol";

export interface ISafeNumber {
  add(numberLike: NumberArg): ISafeNumber;
  sub(numberLike: NumberArg): ISafeNumber;
  div(numberLike: NumberArg): ISafeNumber;
  mul(numberLike: NumberArg): ISafeNumber;
  eq(numberLike: NumberArg): boolean;
  lt(numberLike: NumberArg): boolean;
  lte(numberLike: NumberArg): boolean;
  gt(numberLike: NumberArg): boolean;
  gte(numberLike: NumberArg): boolean;
  abs(): ISafeNumber;
  decimals(): number;
  assertNonNegative(): ISafeNumber;
  /** Convert number to string without loosing precision */
  toString(): string;
  unsafeToNumber(): number;
}

export type NumberArg = utils.NumberLike | ISafeNumber;
