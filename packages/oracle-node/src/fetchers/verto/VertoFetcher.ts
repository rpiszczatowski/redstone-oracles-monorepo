import axios from "axios";
import { getLastPrice } from "../../db/local-db";
import {
  MultiRequestFetcher,
  RequestIdToResponse,
} from "../MultiRequestFetcher";

const vertoSymbolToId = require("./verto-symbol-to-id.json");

const BASE_URL = "https://v2.cache.verto.exchange";

const AR_PRICE_REQUEST_ID = "___AR_PRICE_REQUEST_ID___";

// URL for fetching all tokens details: https://v2.cache.verto.exchange/tokens

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

  override extractPrice(
    dataFeedId: string,
    responses: RequestIdToResponse
  ): number | undefined {
    const arPrice = responses[AR_PRICE_REQUEST_ID];
    return responses[dataFeedId].data.price * arPrice;
  }
}
