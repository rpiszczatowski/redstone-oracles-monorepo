import _ from "lodash";
import axios, { AxiosResponse } from "axios";
import { PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";
import { config } from "../../config";
import { getRequiredPropValue } from "../../utils/objects";

export interface TwelveDataResponse {
  [symbol: string]: {
    price: number;
  };
}

export const TWELVE_DATA_PRICE_URL =
  "https://twelve-data1.p.rapidapi.com/price";

export class TwelveDataFetcher extends BaseFetcher {
  symbolToId: Record<string, string>;
  requestParams?: Record<string, any>;

  constructor(
    name: string,
    symbolToId: Record<string, string>,
    requestParams?: Record<string, any>
  ) {
    super(name);
    this.symbolToId = symbolToId;
    this.requestParams = requestParams;
  }

  override convertIdToSymbol(id: string): string {
    const idToSymbol = _.invert(this.symbolToId);
    return getRequiredPropValue(idToSymbol, id);
  }

  override convertSymbolToId(symbol: string): string {
    return getRequiredPropValue(this.symbolToId, symbol);
  }

  async fetchData(ids: string[]): Promise<AxiosResponse<TwelveDataResponse>> {
    return await axios.get(TWELVE_DATA_PRICE_URL, {
      params: {
        symbol: ids.join(","),
        ...this.requestParams,
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
