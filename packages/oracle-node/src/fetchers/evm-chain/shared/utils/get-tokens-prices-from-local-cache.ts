import Decimal from "decimal.js";
import { getLastPrice } from "../../../../db/local-db";

export const getTokensPricesFromLocalCache = (tokenNames: string[]) => {
  const prices: Decimal[] = [];
  for (const token of tokenNames) {
    const tokenPriceFromDb = getLastPrice(token);
    if (tokenPriceFromDb) {
      const price = tokenPriceFromDb.value;
      prices.push(new Decimal(price));
    }
  }
  return prices;
};
