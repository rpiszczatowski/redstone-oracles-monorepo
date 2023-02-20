import axios from "axios";
import { BaseFetcher } from "../BaseFetcher";
import { config } from "../../config";
import { PricesObj } from "../../types";
import { readJSON } from "../../utils/objects";

export class MockFetcher extends BaseFetcher {
  constructor() {
    super("mock");
  }

  async fetchData() {
    const isMockPricesUrl = config.mockPricesUrlOrPath.startsWith("http");
    if (isMockPricesUrl) {
      return (await axios.get(config.mockPricesUrlOrPath)).data;
    }
    return readJSON(config.mockPricesUrlOrPath);
  }

  extractPrices(response: any, ids: string[]): PricesObj {
    const result: PricesObj = {};

    for (const id of ids) {
      result[id] = response[id] ?? response.__DEFAULT__;
    }
    return result;
  }
}
