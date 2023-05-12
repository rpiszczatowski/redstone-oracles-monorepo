import Decimal from "decimal.js";
import { getLastPrice } from "../../../../db/local-db";

export const getTokensPricesFromLocalCache = (tokenNames: string[]) => {
  const prices: Record<string, Decimal> = {};
  for (const tokenName of tokenNames) {
    const tokenPriceFromDb = getLastPrice(tokenName);
    if (tokenPriceFromDb) {
      const price = tokenPriceFromDb.value;
      prices[tokenName] = new Decimal(price);
    }
  }
  return prices;
};
