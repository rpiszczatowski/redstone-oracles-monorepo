import axios from "axios";
import { getLastPrice } from "../../db/local-db";
import { PricesObj } from "../../types";
import {
  MultiRequestFetcher,
  RequestIdToResponse,
} from "../MultiRequestFetcher";

const vertoSymbolToId = require("./verto-symbol-to-id.json");

const BASE_URL = "https://v2.cache.verto.exchange";

const AR_PRICE_REQUEST_ID = "___AR_PRICE_REQUEST_ID___";

// URL or fetching all tokens details: https://v2.cache.verto.exchange/tokens

export class VertoFetcher extends MultiRequestFetcher {
  constructor() {
    super("verto");
  }

  prepareRequestIds(requestedDataFeedIds: string[]): string[] {
    return [...requestedDataFeedIds, AR_PRICE_REQUEST_ID];
  }

  override async makeRequest(id: string): Promise<any> {
    if (id === AR_PRICE_REQUEST_ID) {
      return getLastPrice("AR")?.value;
    } else {
      return await axios.get(`${BASE_URL}/token/${vertoSymbolToId[id]}/price`);
    }
  }

  // TODO: remove
  // getProcessingContext(): any {
  //   return getLastPrice("AR")?.value;
  // }

  override extractPrice(
    dataFeedId: string,
    responses: RequestIdToResponse
  ): number | undefined {
    const arPrice = responses[AR_PRICE_REQUEST_ID];
    return responses[dataFeedId].data.price * arPrice;
  }

  // TODO: remove
  // processData(
  //   response: any,
  //   pricesObj: PricesObj,
  //   lastArPrice?: number
  // ): PricesObj {
  //   if (lastArPrice === undefined) {
  //     return pricesObj;
  //   }

  //   pricesObj[response.data.ticker] = response.data.price * lastArPrice;

  //   return pricesObj;
  // }
}
