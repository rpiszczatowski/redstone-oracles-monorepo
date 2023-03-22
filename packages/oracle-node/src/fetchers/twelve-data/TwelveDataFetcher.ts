import _ from "lodash";
import axios from "axios";
import { PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";
import { config } from "../../config";
import symbolToId from "./twelve-data-symbol-to-id.json";
import { getRequiredPropValue } from "../../utils/objects";
import { stringifyError } from "../../utils/error-stringifier";

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
    const pricesObj: PricesObj = {};

    const rates = result.data;
    for (const symbol of Object.keys(rates)) {
      try {
        const id = rates[symbol].symbol;
        pricesObj[id] = rates[symbol].rate;
      } catch (error: any) {
        this.logger.error(
          `Extracting price failed for: ${symbol}. ${stringifyError(error)}`
        );
      }
    }

    return pricesObj;
  }
}
