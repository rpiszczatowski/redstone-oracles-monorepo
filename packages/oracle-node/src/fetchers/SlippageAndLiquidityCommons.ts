import Decimal from "decimal.js";
import { getRawPrice, getRawPriceOrFail } from "../db/local-db";

export const DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE = 10_000; // 10k usd

export const convertUsdToTokenAmount = (
  assetId: string,
  decimalsMultiplier: number,
  amountInUsd: number
) => {
  return new Decimal(amountInUsd)
    .div(getRawPriceOrFail(assetId).value)
    .mul(decimalsMultiplier)
    .round()
    .toString();
};

export const tryConvertUsdToTokenAmount = (
  assetId: string,
  decimalsMultiplier: number,
  amountInUsd: number
): string | undefined => {
  let rawPrice = undefined;
  try {
    rawPrice = getRawPrice(assetId)?.value;
  } catch (e: unknown) {
    // ignore
  }
  if (!rawPrice) {
    return undefined;
  }
  return new Decimal(amountInUsd)
    .div(rawPrice)
    .mul(decimalsMultiplier)
    .round()
    .toString();
};

export const calculateSlippage = (
  spotPrice: Decimal.Value,
  priceForBigOrder: Decimal.Value
) => {
  const spotPriceDecimal = new Decimal(spotPrice);
  const priceForBigOrderDecimal = new Decimal(priceForBigOrder);
  return spotPriceDecimal
    .sub(priceForBigOrderDecimal)
    .abs()
    .div(spotPriceDecimal)
    .mul(100)
    .toString();
};
