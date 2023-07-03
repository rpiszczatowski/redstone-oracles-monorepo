import Decimal from "decimal.js";
import { TEN_AS_BASE_OF_POWER } from "../contants";

const DEFAULT_DECIMALS = 18;

export const serializeDecimalsToDefault = (
  balance: Decimal,
  tokenDecimals: number
) => {
  const serializedDecimals = DEFAULT_DECIMALS - tokenDecimals;
  if (serializedDecimals < 0) {
    throw new Error("Decimals cannot be below 0");
  }

  const multiplier = new Decimal(TEN_AS_BASE_OF_POWER).toPower(
    serializedDecimals
  );
  return balance.mul(multiplier);
};
