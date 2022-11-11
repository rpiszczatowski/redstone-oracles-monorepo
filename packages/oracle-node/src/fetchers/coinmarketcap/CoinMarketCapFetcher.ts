import axios from "axios";
import _ from "lodash";
import { BaseFetcher } from "../BaseFetcher";
import { getRequiredPropValue } from "../../utils/objects";
import { FetcherOpts, PricesObj } from "../../types";
import symbolToId from "./symbol-to-id.json";
const idToSymbol = _.invert(symbolToId);

const url =
  "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=";

export class CoinMarketCapFetcher extends BaseFetcher {
  constructor() {
    super("coinmarketcap");
  }

  override convertIdToSymbol(id: string) {
    return getRequiredPropValue(idToSymbol, id);
  }

  override convertSymbolToId(symbol: string) {
    return getRequiredPropValue(symbolToId, symbol);
  }

  async fetchData(ids: string[], opts: FetcherOpts): Promise<any> {
    const urlWithIDs = `${url}${ids.join(",")}`;
    const apiKey = opts.credentials.coinmarketcapApiKey;
    if (!apiKey) {
      throw new Error("Missing Coinmarketcap API Key");
    }
    const response = await axios.get(urlWithIDs, {
      headers: {
        "X-CMC_PRO_API_KEY": apiKey,
      },
    });
    return response.data;
  }

  async extractPrices(response: any, ids: string[]): Promise<PricesObj> {
    const pricesObj: { [symbol: string]: number } = {};
    const tokenData = response.data;

    for (const id of ids) {
      const price = tokenData[id].quote.USD.price;
      pricesObj[id] = price;
    }

    return pricesObj;
  }
}
