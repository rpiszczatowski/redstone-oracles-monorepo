import _ from "lodash";
import axios, { AxiosResponse } from "axios";
import { PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";
import { config } from "../../config";
import symbolToId from "./twelve-data-symbol-to-id.json";
import { getRequiredPropValue } from "../../utils/objects";

interface TwelveDataResponse {
  [symbol: string]: {
    price: number;
  };
}

const TWELVE_DATA_PRICE_URL = "https://twelve-data1.p.rapidapi.com/price";

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
    return await axios.get(TWELVE_DATA_PRICE_URL, {
      params: {
        symbol: ids.join(","),
      },
      headers: {
        "RapidAPI-Key": config.twelveDataRapidApiKey,
      },
    });
  }

  extractPrices(response: AxiosResponse<TwelveDataResponse>): PricesObj {
    const twelveDataResponse = response.data;

    return this.extractPricesSafely(Object.keys(twelveDataResponse), (id) => ({
      value: twelveDataResponse[id].price,
      id,
    }));
  }
}
