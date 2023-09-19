import axios from "axios";
import { BaseFetcher } from "../BaseFetcher";
import { config } from "../../config";
import { PricesObj } from "../../types";
import { readJSON } from "../../utils/objects";

type MockResponse = Record<string, number | undefined>;
export class MockFetcher extends BaseFetcher {
  constructor() {
    super("mock");
  }

  override async fetchData() {
    const isMockPricesUrl = config.mockPricesUrlOrPath.startsWith("http");
    if (isMockPricesUrl) {
      return (await axios.get<MockResponse>(config.mockPricesUrlOrPath)).data;
    }
    return readJSON(config.mockPricesUrlOrPath);
  }

  override extractPrices(response: MockResponse, ids: string[]): PricesObj {
    const result: PricesObj = {};

    for (const id of ids) {
      result[id] = response[id] ?? response.__DEFAULT__;
    }
    return result;
  }
}
