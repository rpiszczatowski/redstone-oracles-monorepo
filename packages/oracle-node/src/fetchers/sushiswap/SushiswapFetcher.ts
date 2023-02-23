import { PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";
import DexProxy from "./DexProxy";

export class SushiswapFetcher extends BaseFetcher {
  private dexProxy: DexProxy;

  constructor() {
    super("sushiswap");
    this.dexProxy = new DexProxy();
  }

  async fetchData(ids: string[]): Promise<any> {
    return await this.dexProxy.getExchangeRates(ids);
  }

  async extractPrices(response: any): Promise<PricesObj> {
    const pricesObj: PricesObj = {};

    for (const id of Object.keys(response)) {
      const decimalPrice =
        Number(response[id].price) * Math.pow(10, -response[id].decimalPlaces);

      pricesObj[id] = parseFloat(decimalPrice.toFixed(8));
    }
    return pricesObj;
  }
}
