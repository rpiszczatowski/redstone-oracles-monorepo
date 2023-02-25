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

  extractPrices(response: any): PricesObj {
    const pricesObj: PricesObj = {};

    const results = response.result;
    for (const result of results) {
      const symbol = result.s;
      const price = result.p;
      pricesObj[symbol] = Number(price);
    }

    return pricesObj;
  }
}
