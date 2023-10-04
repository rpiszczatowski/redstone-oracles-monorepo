import {
  MultiRequestFetcher,
  RequestIdToResponse,
} from "../MultiRequestFetcher";
import { config } from "../../config";
import axios, { AxiosResponse } from "axios";

type KaikoResponse = {
  data: {
    price: string;
  }[];
};

const KAIKO_PRICES_URL =
  "https://eu.market-api.kaiko.io/v2/data/trades.v1/spot_exchange_rate";
const KAIKO_REQUEST_HEADERS = {
  "X-Api-Key": config.kaikoApiKey,
  Accept: "application/json",
} as Record<string, string>;
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

  static buildKaikoApiUrl = (id: string): string => {
    return `${KAIKO_PRICES_URL}/${id.toLowerCase()}/usd`;
  };

  override makeRequest(id: string): Promise<AxiosResponse<KaikoResponse>> {
    return axios.get(KaikoV2Fetcher.buildKaikoApiUrl(id), {
      headers: KAIKO_REQUEST_HEADERS,
      params: KAIKO_REQUEST_PARAMS,
    });
  }

  override extractPrice(
    dataFeedId: string,
    responses: RequestIdToResponse<AxiosResponse<KaikoResponse | undefined>>
  ): number | undefined {
    const price = responses[dataFeedId]?.data?.data[0].price;
    return price ? Number(price) : undefined;
  }
}
