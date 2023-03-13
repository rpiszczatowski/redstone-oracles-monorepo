import {
  MultiRequestFetcher,
  RequestIdToResponse,
} from "../MultiRequestFetcher";
import axios, { AxiosResponse } from "axios";
import { DeribitResult } from "./types";

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

  buildDeribitApiUrl = (id: string): string => {
    return `${DERIBIT_PRICES_URL}${id.toLowerCase()}_usdc`;
  };

  makeRequest(id: string): Promise<AxiosResponse<DeribitResult>> {
    return axios.get(this.buildDeribitApiUrl(id), DERIBIT_CONFIG);
  }

  override extractPrice(
    dataFeedId: string,
    responses: RequestIdToResponse
  ): number | undefined {
    if (responses[dataFeedId]) {
      const price = responses[dataFeedId]?.data?.result.index_price;
      return price ? Number(price) : undefined;
    }
  }
}
