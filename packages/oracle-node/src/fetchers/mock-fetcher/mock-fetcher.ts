import axios from "axios";
import { BaseFetcher } from "../BaseFetcher";
import { config } from "../../config";
import { PricesObj } from "../../types";
import { readJSON } from "../../utils/objects";

export class MockFetcher extends BaseFetcher {
  index: number;
  constructor() {
    super("mock");
    this.index = 0;
  }

  async fetchData() {
    const isMockPricesUrl = config.mockPricesUrlOrPath.startsWith("http");
    if (isMockPricesUrl) {
      return (await axios.get(config.mockPricesUrlOrPath)).data;
    }
    const data = readJSON(config.mockPricesUrlOrPath);
    const value = data[this.index].rate_high;
    this.index = this.index + 1;
    return { LUNA: value };
  }

  async extractPrices(response: any, ids: string[]): Promise<PricesObj> {
    const result: PricesObj = {};

    for (const id of ids) {
      result[id] = response[id] ?? response.__DEFAULT__;
    }
    return result;
  }
}
