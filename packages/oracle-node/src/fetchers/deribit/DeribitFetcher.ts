import {
  MultiRequestFetcher,
  RequestIdToResponse,
} from "../MultiRequestFetcher";
import axios, { AxiosResponse } from "axios";
import { DeribitResult } from "./types";

const DERIBIT_PRICES_URL =
  "https://test.deribit.com/api/v2/public/get_index_price";
const DERIBIT_REQUEST_HEADERS = {
  Accept: "application/json",
};

export class DeribitFetcher extends MultiRequestFetcher {
  constructor() {
    super("deribit");
  }

  override makeRequest(id: string): Promise<AxiosResponse<DeribitResult>> {
    return axios.get(DERIBIT_PRICES_URL, {
      headers: DERIBIT_REQUEST_HEADERS,
      params: { index_name: `${id.toLowerCase()}_usdc` },
    });
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
