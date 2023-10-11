import Decimal from "decimal.js";
import { getRawPriceOrFail, getRawPriceNotOlderThan } from "../db/local-db";

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

const MAX_PRICE_IN_DB_TIME_DIFF_FOR_SLIPPAGE = 1000 * 60 * 180;

const getRawPriceForSlippage = (symbol: string) =>
  getRawPriceNotOlderThan(symbol, MAX_PRICE_IN_DB_TIME_DIFF_FOR_SLIPPAGE);

export const tryConvertUsdToTokenAmount = (
  assetId: string,
  decimalsMultiplier: number,
  amountInUsd: number
): string | undefined => {
  // we want this method to throw if price is too old
  // a manual intervention is required in such a situation
  const rawPrice = getRawPriceForSlippage(assetId)?.value;
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
