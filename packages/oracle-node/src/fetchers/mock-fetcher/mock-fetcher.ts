import { BaseFetcher } from "../BaseFetcher";
import { PricesObj } from "../../types";
import { config } from "../../config";
import axios from "axios";

export class MockFetcher extends BaseFetcher {
  constructor() {
    super("mock-fetcher");
  }

  async fetchData(ids: string[]) {
    let mockedPrices = await axios.get(config.mockPricesUrl);
    let result = {};
    ids.forEach((id) => {
      let price;
      if (id in mockedPrices.data) {
        price = mockedPrices.data[id];
      } else {
        price = mockedPrices.data.__DEFAULT__;
      }
      result = {
        ...result,
        [id]: price,
      };
    });
    return result;
  }

  async extractPrices(response: any): Promise<PricesObj> {
    return response;
  }
}
