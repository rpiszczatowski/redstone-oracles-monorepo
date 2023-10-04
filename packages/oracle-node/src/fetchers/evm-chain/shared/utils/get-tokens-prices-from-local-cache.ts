import Decimal from "decimal.js";
import { getRawPriceOrFail } from "../../../../db/local-db";

export const getTokensPricesFromLocalCache = (tokenNames: string[]) => {
  const prices: Record<string, Decimal> = {};
  for (const tokenName of tokenNames) {
    const tokenPriceFromDb = getRawPriceOrFail(tokenName);
    const price = tokenPriceFromDb.value;
    prices[tokenName] = new Decimal(price);
  }
  return prices;
};
