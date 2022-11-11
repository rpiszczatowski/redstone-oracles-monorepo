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

  async extractPrices(response: any): Promise<PricesObj> {
    const pricesObj: { [id: string]: number } = {};

    for (const id of Object.keys(response)) {
      const decimalPrice =
        Number(response[id].price) * Math.pow(10, -response[id].decimalPlaces);

      pricesObj[id] = parseFloat(decimalPrice.toFixed(8));
    }
    return pricesObj;
  }
}
