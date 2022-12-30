import { MultiRequestFetcher } from "../MultiRequestFetcher";
import { PricesObj } from "../../types";
import { config } from "../../config";

const axios = require("axios");

const KAIKO_PRICES_URL =
  "https://eu.market-api.kaiko.io/v2/data/trades.v1/spot_exchange_rate";
const KAIKO_CONFIG = {
  headers: {
    "X-Api-Key": config.kaikoApiKey,
    Accept: "application/json",
  },
  params: {
    page_size: 1,
    interval: "1m",
    sort: "desc",
  },
};

export class KaikoFetcher extends MultiRequestFetcher {
  constructor() {
    super("kaiko");
  }

  makeRequest(id: string): Promise<any> {
    return axios.get(
      `${KAIKO_PRICES_URL}/${id.toLowerCase()}/usd`,
      KAIKO_CONFIG
    );
  }

  processData(data: any, pricesObj: PricesObj): PricesObj {
    if (data.result === "error") {
      return pricesObj;
    }

    pricesObj[data.query.base_asset.toUpperCase()] = Number(data.data[0].price);
    return pricesObj;
  }
}
