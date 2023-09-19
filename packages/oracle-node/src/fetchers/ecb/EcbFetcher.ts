import * as exchangeRates from "ecb-euro-exchange-rates";
import { PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";

export class EcbFetcher extends BaseFetcher {
  constructor() {
    super("ecb");
  }

  override async fetchData(): Promise<exchangeRates.IExchangeRateResult> {
    return await exchangeRates.fetch();
  }

  override extractPrices(
    response: exchangeRates.IExchangeRateResult,
    ids: (keyof exchangeRates.IExchangeRates)[]
  ): PricesObj {
    const { rates } = response;
    const usdRate = rates.USD;

    return this.extractPricesSafely(ids, (id) =>
      EcbFetcher.extractPricePair(id, usdRate, rates)
    );
  }

  private static extractPricePair = (
    id: keyof exchangeRates.IExchangeRates,
    usdRate: number,
    rates: exchangeRates.IExchangeRates
  ) => {
    if ((id as string) === "EUR") {
      return { value: usdRate, id };
    } else {
      return { value: (1 / rates[id]) * usdRate, id };
    }
  };
}
