import { BaseFetcher } from "../BaseFetcher";
import { PricesObj } from "../../types";
import { config } from "../../config";
import axios from "axios";

export class MockFetcher extends BaseFetcher {
  constructor() {
    super("mock");
  }

  async fetchData(ids: string[]) {
    const mockedPrices = (await axios.get(config.mockPricesUrl)).data;
    const result: { [id: string]: number } = {};

    for (const id of ids) {
      result[id] = mockedPrices[id] ?? mockedPrices.__DEFAULT__;
    }
    return result;
  }

  async extractPrices(response: any): Promise<PricesObj> {
    return response;
  }
}
