import axios from "axios";
import { PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";
import { config } from "../../config";

const TWELVE_DATA_RATE_URL =
  "https://twelve-data1.p.rapidapi.com/exchange_rate";

export class TwelveDataFetcher extends BaseFetcher {
  constructor() {
    super("twelve-data");
  }

  override convertIdToSymbol(id: string): string {
    const [symbol] = id.split("/");
    return symbol;
  }

  override convertSymbolToId(symbol: string): string {
    return `${symbol}/USD`;
  }

  async fetchData(ids: string[]): Promise<any> {
    const symbolString = ids.join(",");
    return await axios.get(`${TWELVE_DATA_RATE_URL}?symbol=${symbolString}`, {
      headers: {
        "RapidAPI-Key": config.twelveDataRapidApiKey,
      },
    });
  }

  extractPrices(result: any): PricesObj {
    const pricesObj: PricesObj = {};

    const rates = result.data;
    for (const symbol of Object.keys(rates)) {
      const id = rates[symbol].symbol;
      pricesObj[id] = rates[symbol].rate;
    }

    return pricesObj;
  }
}
