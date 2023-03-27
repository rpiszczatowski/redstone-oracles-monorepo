import { PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";
import ChainlinkProxy from "./ChainlinkProxy";

export class ChainlinkFetcher extends BaseFetcher {
  private chainlinkProxy: ChainlinkProxy;

  constructor() {
    super("chainlink");
    this.chainlinkProxy = new ChainlinkProxy();
  }

  async fetchData(ids: string[]): Promise<any> {
    return await this.chainlinkProxy.getExchangeRates(ids);
  }

  extractPrices(response: any): PricesObj {
    return this.extractPricesSafely(
      Object.keys(response),
      (id) => {
        const decimalPrice =
          Number(response[id].price) *
          Math.pow(10, -response[id].decimalPlaces);

        return parseFloat(decimalPrice.toFixed(8));
      },
      (id) => id
    );
  }
}
