import _ from "lodash";
import axios, { AxiosResponse } from "axios";
import { PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";
import { config } from "../../config";
import { getRequiredPropValue, isDefined } from "../../utils/objects";

type Price = {
  price: number;
};

type SuccessResponse = {
  [symbol: string]: Price;
};

export type TwelveDataResponse = (Price | SuccessResponse) & { status: string };

export const TWELVE_DATA_PRICE_URL = "https://api.twelvedata.com/price";

export class TwelveDataFetcher extends BaseFetcher {
  symbolToId: Record<string, string>;
  requestParams?: Record<string, unknown>;

  constructor(
    name: string,
    symbolToId: Record<string, string>,
    requestParams?: Record<string, unknown>
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

  override async fetchData(
    ids: string[]
  ): Promise<AxiosResponse<TwelveDataResponse>> {
    return await axios.get(TWELVE_DATA_PRICE_URL, {
      params: {
        symbol: ids.join(","),
        ...this.requestParams,
        apikey: config.twelveDataApiKey,
      },
    });
  }
  override validateResponse(
    response: AxiosResponse<TwelveDataResponse>
  ): boolean {
    return (
      isDefined(response) &&
      isDefined(response.data) &&
      response.data.status !== "error"
    );
  }

  override serializeResponse(
    response: AxiosResponse<TwelveDataResponse>
  ): string {
    // response is a circular object of the size of ~3MB.
    // we want to get only the crucial part
    return JSON.stringify(response.data);
  }

  override extractPrices(
    response: AxiosResponse<TwelveDataResponse>,
    ids: string[]
  ): PricesObj {
    const twelveDataResponse = response.data;

    // If we require only 1 data feed price, response would be { price: xxx }
    if (ids.length === 1) {
      const id = ids[0];
      const value = (twelveDataResponse as Price).price;
      return this.extractPricesSafely([id], (id) => ({
        id,
        value: Number(value),
      }));
    }

    return this.extractPricesSafely(Object.keys(twelveDataResponse), (id) => ({
      value: this.isInverseQuote(id)
        ? 1 / Number((twelveDataResponse as SuccessResponse)[id].price)
        : Number((twelveDataResponse as SuccessResponse)[id].price),
      id,
    }));
  }

  // This is used when twelve data only has data feed as e.g USD/CNH and CNH/USD doesn't exists
  isInverseQuote(id: string) {
    const dataFeedIdsWhichAreInverse = ["CNH"];
    const dataFeedId = this.convertIdToSymbol(id);
    return dataFeedIdsWhichAreInverse.includes(dataFeedId);
  }
}
