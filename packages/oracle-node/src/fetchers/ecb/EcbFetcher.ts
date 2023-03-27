import * as exchangeRates from "ecb-euro-exchange-rates";
import { PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";

export class EcbFetcher extends BaseFetcher {
  constructor() {
    super("ecb");
  }

  async fetchData(): Promise<any> {
    return await exchangeRates.fetch();
  }

  extractPrices(response: any, ids: string[]): PricesObj {
    const { rates } = response;
    const usdRate = rates.USD;

    return this.extractPricesSafely(
      ids,
      (id, pricesObj) => this.extractPrice(id, pricesObj, usdRate, rates),
      (id) => id
    );
  }

  private extractPrice(
    id: string,
    pricesObj: PricesObj,
    usdRate: any,
    rates: any
  ): number | undefined {
    if (id === "EUR") {
      return usdRate;
    } else {
      return (1 / rates[id]) * usdRate;
    }
  }
}
