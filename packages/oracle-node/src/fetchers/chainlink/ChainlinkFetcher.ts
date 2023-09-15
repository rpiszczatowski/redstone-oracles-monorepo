import { PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";
import ChainlinkProxy, { ChainlinkResults } from "./ChainlinkProxy";

export class ChainlinkFetcher extends BaseFetcher {
  private chainlinkProxy: ChainlinkProxy;

  constructor() {
    super("chainlink");
    this.chainlinkProxy = new ChainlinkProxy();
  }

  override async fetchData(ids: string[]): Promise<ChainlinkResults> {
    return await this.chainlinkProxy.getExchangeRates(ids);
  }

  override extractPrices(response: ChainlinkResults): PricesObj {
    return this.extractPricesSafely(Object.keys(response), (id) => {
      const decimalPrice =
        Number(response[id].price) * Math.pow(10, -response[id].decimalPlaces);

      return { value: parseFloat(decimalPrice.toFixed(8)), id: id };
    });
  }
}
