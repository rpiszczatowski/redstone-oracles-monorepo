import axios from "axios";
import _ from "lodash";
import { PricesObj } from "../../types";
import { getRequiredPropValue } from "../../utils/objects";
import { BaseFetcher } from "../BaseFetcher";
import symbolToId from "./symbol-to-id.json";

const url = `https://sapi.xt.com/v4/public/ticker/price?symbols=`;

type PriceResult = { p: string; s: string };
type XtResponse = {
  result: PriceResult[];
};

export class XtFetcher extends BaseFetcher {
  constructor() {
    super("xt");
  }

  override convertIdToSymbol(id: string) {
    return getRequiredPropValue<string>(_.invert(symbolToId), id);
  }

  override convertSymbolToId(symbol: string) {
    return getRequiredPropValue<string>(symbolToId, symbol);
  }

  override async fetchData(ids: string[]) {
    const urlWithSymbols = `${url}${ids.join(",")}`;
    const response = await axios.get<XtResponse>(urlWithSymbols);
    return response.data;
  }

  override extractPrices(response: XtResponse): PricesObj {
    const results = response.result;
    return this.extractPricesSafely(results, (result) => ({
      value: Number(result.p),
      id: result.s,
    }));
  }
}
