import {
  MultiRequestFetcher,
  RequestIdToResponse,
} from "../MultiRequestFetcher";
import { config } from "../../config";
import axios from "axios";

const KAIKO_PRICES_URL =
  "https://eu.market-api.kaiko.io/v2/data/trades.v1/spot_exchange_rate";
const KAIKO_REQUEST_HEADERS = {
  "X-Api-Key": config.kaikoApiKey,
  Accept: "application/json",
};
const KAIKO_REQUEST_PARAMS = {
  page_size: 90,
  interval: "10s",
  sort: "desc",
  extrapolate_missing_values: true,
  startTime: new Date().getTime() - 1000 * 60 * 15,
};

export class KaikoV2Fetcher extends MultiRequestFetcher {
  constructor() {
    super("kaiko-v2");
  }

  buildKaikoApiUrl = (id: string): string => {
    return `${KAIKO_PRICES_URL}/${id.toLowerCase()}/usd`;
  };

  override makeRequest(id: string): Promise<any> {
    return axios.get(this.buildKaikoApiUrl(id), {
      headers: KAIKO_REQUEST_HEADERS,
      params: KAIKO_REQUEST_PARAMS,
    });
  }

  override extractPrice(
    dataFeedId: string,
    responses: RequestIdToResponse
  ): number | undefined {
    const price = responses[dataFeedId]?.data?.data[0].price;
    return price ? Number(price) : undefined;
  }
}
