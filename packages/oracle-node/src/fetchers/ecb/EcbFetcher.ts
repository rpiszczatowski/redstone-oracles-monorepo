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

    return this.extractPricesSafely(ids, (id) =>
      this.extractPricePair(id, usdRate, rates)
    );
  }

  private extractPricePair(id: string, usdRate: any, rates: any) {
    if (id === "EUR") {
      return { value: usdRate, id };
    } else {
      return { value: (1 / rates[id]) * usdRate, id };
    }
  }
}
