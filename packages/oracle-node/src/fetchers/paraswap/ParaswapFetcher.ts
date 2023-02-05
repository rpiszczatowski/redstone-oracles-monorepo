import { PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";

export class ParaswapFetcher extends BaseFetcher {
  constructor() {
    super("paraswap");
  }

  // TODO: implement
  async fetchData(ids: string[]): Promise<any> {
    return {};
  }

  // TODO: implement
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
