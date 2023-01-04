import { MultiRequestFetcher } from "../MultiRequestFetcher";
import { PricesObj } from "../../types";
import { config } from "../../config";
import axios from "axios";

const KAIKO_PRICES_URL =
  "https://eu.market-api.kaiko.io/v2/data/trades.v1/spot_exchange_rate";
const KAIKO_REQUEST_HEADERS = {
  "X-Api-Key": config.kaikoApiKey,
  Accept: "application/json",
};
const KAIKO_REQUEST_PARAMS = {
  page_size: 1,
  interval: "1m",
  sort: "desc",
};
const KAIKO_CONFIG = {
  headers: KAIKO_REQUEST_HEADERS,
  params: KAIKO_REQUEST_PARAMS,
};

export class KaikoFetcher extends MultiRequestFetcher {
  constructor() {
    super("kaiko");
  }

  buildKaikoApiUrl = (id: string): string => {
    return `${KAIKO_PRICES_URL}/${id.toLowerCase()}/usd`;
  };

  makeRequest(id: string): Promise<any> {
    return axios.get(this.buildKaikoApiUrl(id), KAIKO_CONFIG);
  }

  processData(data: any, pricesObj: PricesObj): PricesObj {
    if (data.result === "error") {
      return pricesObj;
    }
    const id = data.query.base_asset.toUpperCase();
    const price = data.data[0].price;
    pricesObj[id] = Number(price);
    return pricesObj;
  }
}
