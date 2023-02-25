import axios from "axios";
import { BaseFetcher } from "../BaseFetcher";
import { PricesObj } from "../../types";

const BAND_ORACLE_API_URL = `https://laozi1.bandchain.org/api/oracle/v1/request_prices`;
const symbols = ["BTC", "ETH", "AAVE", "UNI"];

interface BandResponse {
  data: {
    price_results: [
      {
        symbol: string;
        px: number;
        multiplier: number;
        [otherOptions: string]: unknown;
      }
    ];
  };
}

export class BandFetcher extends BaseFetcher {
  constructor() {
    super("band");
  }

  async fetchData() {
    const requestCurriences = new URLSearchParams();
    for (const symbol of symbols) {
      requestCurriences.append("symbols", symbol);
    }

    const response = await axios.get(BAND_ORACLE_API_URL, {
      params: requestCurriences,
    });
    return response;
  }

  extractPrices(response: BandResponse): PricesObj {
    const pricesArray = response.data.price_results;
    const pricesObj: PricesObj = {};
    for (const asset of pricesArray) {
      pricesObj[asset.symbol] = asset.px / asset.multiplier;
    }
    return pricesObj;
  }
}
