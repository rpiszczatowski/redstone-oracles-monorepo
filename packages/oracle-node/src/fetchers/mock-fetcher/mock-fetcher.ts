import { BaseFetcher } from "../BaseFetcher";
import { PricesObj } from "../../types";
import { config } from "../../config";
import axios from "axios";

export class MockFetcher extends BaseFetcher {
  constructor() {
    super("mock");
  }

  async fetchData(ids: string[]) {
    return (await axios.get(config.mockPricesUrl)).data;
  }

  async extractPrices(response: any, ids: string[]): Promise<PricesObj> {
    const result: PricesObj = {};

    for (const id of ids) {
      result[id] = response[id] ?? response.__DEFAULT__;
    }
    return result;
  }
}
