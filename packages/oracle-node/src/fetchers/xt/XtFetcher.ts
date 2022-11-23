import axios from "axios";
import _ from "lodash";
import { PricesObj } from "../../types";
import { getRequiredPropValue } from "../../utils/objects";
import { BaseFetcher } from "../BaseFetcher";
import symbolToId from "./symbol-to-id.json";

const url = `https://sapi.xt.com/v4/public/ticker/price?symbols=`;

export class XtFetcher extends BaseFetcher {
  constructor() {
    super("xt");
  }

  override convertIdToSymbol(id: string) {
    return getRequiredPropValue(_.invert(symbolToId), id);
  }

  override convertSymbolToId(symbol: string) {
    return getRequiredPropValue(symbolToId, symbol);
  }

  async fetchData(ids: string[]) {
    const urlWithSymbols = `${url}${ids.join(",")}`;
    const response = await axios.get(urlWithSymbols);
    return response.data;
  }

  async extractPrices(response: any): Promise<PricesObj> {
    const pricesObj: { [id: string]: number } = {};

    const results = await response.result;
    for (const result of results) {
      const symbol = result.s;
      const prices = result.p;
      pricesObj[symbol] = Number(prices);
    }

    return pricesObj;
  }
}
