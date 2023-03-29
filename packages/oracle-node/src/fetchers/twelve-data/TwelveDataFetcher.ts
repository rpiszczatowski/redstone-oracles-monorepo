import _ from "lodash";
import axios from "axios";
import { PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";
import { config } from "../../config";
import symbolToId from "./twelve-data-symbol-to-id.json";
import { getRequiredPropValue } from "../../utils/objects";

const TWELVE_DATA_RATE_URL =
  "https://twelve-data1.p.rapidapi.com/exchange_rate";

const idToSymbol = _.invert(symbolToId);

export class TwelveDataFetcher extends BaseFetcher {
  constructor() {
    super("twelve-data");
  }

  override convertIdToSymbol(id: string): string {
    return getRequiredPropValue(idToSymbol, id);
  }

  override convertSymbolToId(symbol: string): string {
    return getRequiredPropValue(symbolToId, symbol);
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
    const rates = result.data;

    return this.extractPricesSafely(Object.keys(rates), (key) => ({
      value: rates[key].rate,
      id: rates[key].symbol,
    }));
  }
}
