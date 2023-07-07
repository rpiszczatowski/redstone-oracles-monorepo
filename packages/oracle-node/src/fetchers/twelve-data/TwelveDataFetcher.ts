import _ from "lodash";
import axios, { AxiosResponse } from "axios";
import { PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";
import { config } from "../../config";
import { getRequiredPropValue, isDefined } from "../../utils/objects";

export interface TwelveDataResponse {
  [symbol: string]: {
    price: number;
  };
}

export const TWELVE_DATA_PRICE_URL = "https://api.twelvedata.com/price";

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
        apikey: config.twelveDataApiKey,
      },
    });
  }
  override validateResponse(response: any): boolean {
    return isDefined(response) && isDefined(response.data) && response.data.status !== "error";
  }

  override serializeResponse(response: any): string {
    // response is a circular object of the size of ~3MB.
    // we want to get only the crucial part
    return JSON.stringify(response.data);
  }

  extractPrices(
    response: AxiosResponse<TwelveDataResponse>,
    ids: string[]
  ): PricesObj {
    const twelveDataResponse = response.data;

    // If we require only 1 data feed price, response would be { price: xxx }
    if (ids.length === 1) {
      const id = ids[0];
      const value = (twelveDataResponse as unknown as { price: number }).price;
      return this.extractPricesSafely([id], (id) => ({ id, value }));
    }

    return this.extractPricesSafely(Object.keys(twelveDataResponse), (id) => ({
      value: twelveDataResponse[id].price,
      id,
    }));
  }
}
