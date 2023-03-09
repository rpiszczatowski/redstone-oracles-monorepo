import { MultiRequestFetcher } from "../MultiRequestFetcher";
import { PricesObj } from "../../types";
import axios from "axios";
import { DeribitResponse } from "./types";

const DERIBIT_PRICES_URL =
  "https://test.deribit.com/api/v2/public/get_index_price?index_name=";
const DERIBIT_REQUEST_HEADERS = {
  Accept: "application/json",
};
const DERIBIT_CONFIG = {
  headers: DERIBIT_REQUEST_HEADERS,
};

export class DeribitFetcher extends MultiRequestFetcher {
  constructor() {
    super("deribit");
  }
  ids: string[] = [];

  getRequestContext(ids: string[]) {
    this.ids = ids;
  }

  buildDeribitApiUrl = (id: string): string => {
    return `${DERIBIT_PRICES_URL}${id.toLowerCase()}_usdc`;
  };

  makeRequest(id: string): Promise<any> {
    return axios.get(this.buildDeribitApiUrl(id), DERIBIT_CONFIG);
  }

  processData(
    response: DeribitResponse,
    pricesObj: PricesObj,
    index: number
  ): PricesObj {
    if (response.data.error) {
      return pricesObj;
    }
    const id = this.ids[index];
    const price = response.data.result.index_price;
    pricesObj[id] = price;
    return pricesObj;
  }

  extractPrices(responses: PromiseSettledResult<any>[]): PricesObj {
    let result: PricesObj = {};

    for (const [index, response] of responses.entries()) {
      if (response.status === "rejected" || response.value === undefined) {
        continue;
      }
      result = this.processData(response.value, result, index);
    }
    return result;
  }
}
