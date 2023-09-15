import axios from "axios";
import _ from "lodash";
import { BaseFetcher } from "../BaseFetcher";
import { getRequiredPropValue } from "../../utils/objects";
import { PricesObj } from "../../types";
import symbolToId from "./symbol-to-id.json";
import { config } from "../../config";
const idToSymbol = _.invert(symbolToId);

type CoinmarketcapResponse = {
  data?: {
    [symbol: string]: {
      quote?: {
        USD?: {
          price: number;
        };
      };
    };
  };
};

export class CoinMarketCapFetcher extends BaseFetcher {
  constructor() {
    super("coinmarketcap");
  }

  override convertIdToSymbol(id: string) {
    return getRequiredPropValue<string>(idToSymbol, id);
  }

  override convertSymbolToId(symbol: string) {
    return getRequiredPropValue<string>(symbolToId, symbol);
  }

  override async fetchData(ids: string[]): Promise<CoinmarketcapResponse> {
    const apiKey = config.coinmarketcapApiKey;
    if (!apiKey) {
      throw new Error("Missing Coinmarketcap API Key");
    }
    const response = await axios.get<CoinmarketcapResponse>(
      config.coinmarketcapApiUrl,
      {
        params: {
          id: ids.join(","),
        },
        headers: {
          "X-CMC_PRO_API_KEY": apiKey,
        },
      }
    );
    return response.data;
  }

  override extractPrices(
    response: CoinmarketcapResponse,
    ids: string[]
  ): PricesObj {
    const tokenData = response.data;

    return this.extractPricesSafely(ids, (id) => ({
      value: tokenData?.[id]?.quote?.USD?.price,
      id,
    }));
  }
}
