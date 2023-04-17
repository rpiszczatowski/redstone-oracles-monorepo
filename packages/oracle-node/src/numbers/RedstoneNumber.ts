import { NumberLike } from "redstone-protocol/src/common/utils";

export interface RedstoneNumber {
  add(numberLike: NumberArg): RedstoneNumber;
  sub(numberLike: NumberArg): RedstoneNumber;
  div(numberLike: NumberArg): RedstoneNumber;
  mul(numberLike: NumberArg): RedstoneNumber;
  eq(numberLike: NumberArg): boolean;
  lt(numberLike: NumberArg): boolean;
  lte(numberLike: NumberArg): boolean;
  gt(numberLike: NumberArg): boolean;
  gte(numberLike: NumberArg): boolean;
  abs(): RedstoneNumber;
  decimals(): number;
  assertNonNegative(): RedstoneNumber;
  /** Convert number to string without loosing precision */
  toString(): string;
  unsafeToNumber(): number;
}

export type NumberArg = NumberLike | RedstoneNumber;
