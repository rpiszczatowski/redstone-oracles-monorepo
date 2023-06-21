import Decimal from "decimal.js";
import { getRawPrice } from "../../../../db/local-db";

export const getTokensPricesFromLocalCache = (tokenNames: string[]) => {
  const prices: Record<string, Decimal> = {};
  for (const tokenName of tokenNames) {
    const tokenPriceFromDb = getRawPrice(tokenName);
    if (!tokenPriceFromDb) {
      throw new Error(`Cannot get last price of ${tokenName} from local cache`);
    }
    const price = tokenPriceFromDb.value;
    prices[tokenName] = new Decimal(price);
  }
  return prices;
};
