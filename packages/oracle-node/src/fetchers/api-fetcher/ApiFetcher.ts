import axios from "axios";
import jp from "jsonpath";
import Decimal from "decimal.js";
import {
  MultiRequestFetcher,
  RequestIdToResponse,
} from "../MultiRequestFetcher";
import { getLastPriceOrFail } from "../../db/local-db";

interface ApiFetcherConfig {
  url: string;
  jsonpath: string;
  pairedToken?: string;
  isReverted?: boolean;
}

export class ApiFetcher extends MultiRequestFetcher {
  protected override retryForInvalidResponse: boolean = true;

  constructor(
    apiName: string,
    private apiFetcherConfig: Record<string, ApiFetcherConfig>
  ) {
    super(`${apiName}-api`);
  }

  override async makeRequest(dataFeedId: string): Promise<unknown> {
    const { url } = this.apiFetcherConfig[dataFeedId];
    return (await axios.get<unknown>(url)).data;
  }

  override extractPrice(
    dataFeedId: string,
    responses: RequestIdToResponse<unknown>
  ): number | undefined {
    const response = responses[dataFeedId];
    const rawPrice = this.extractPriceFromResponse(dataFeedId, response);
    return this.calculatePriceBasedOnConfig(dataFeedId, rawPrice).toNumber();
  }

  private extractPriceFromResponse(
    dataFeedId: string,
    response: unknown
  ): Decimal {
    const { url, jsonpath } = this.apiFetcherConfig[dataFeedId];
    const [extractedValue] = jp.query(response, jsonpath) as Decimal.Value[];

    if (typeof extractedValue === "undefined") {
      throw new Error(`Request to ${url} returned undefined`);
    }

    const isEmptyString =
      typeof extractedValue === "string" && extractedValue.length === 0;
    if (isEmptyString) {
      throw new Error(`Request to ${url} returned empty string`);
    }

    return new Decimal(extractedValue);
  }

  private calculatePriceBasedOnConfig(
    dataFeedId: string,
    rawPrice: Decimal
  ): Decimal {
    const { pairedToken, isReverted } = this.apiFetcherConfig[dataFeedId];
    let pairedTokenPrice = 1;
    if (pairedToken) {
      pairedTokenPrice = getLastPriceOrFail(pairedToken).value;
    }
    let price = rawPrice.mul(pairedTokenPrice);
    if (isReverted) {
      price = new Decimal(1).div(price);
    }
    return price;
  }
}
