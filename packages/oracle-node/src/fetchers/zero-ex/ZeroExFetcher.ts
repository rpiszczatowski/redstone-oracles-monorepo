import axios from "axios";
import { PricesObj } from "../../types";
import { parseSymbolWithTradeDetails } from "../../utils/symbols-parser";
import { BaseFetcher } from "../BaseFetcher";

const ZERO_EX_API_URL = "https://api.0x.org/swap/v1/quote";

// TODO: use multireuest fetcher
export class ZeroExFetcher extends BaseFetcher {
  constructor() {
    super("zero-ex");
  }

  async fetchData(ids: string[]): Promise<any> {
    const responses = {};
    const promises = ids.map((id) => {
      const potentialTradeDetails = parseSymbolWithTradeDetails(id);
      return axios
        .get(ZERO_EX_API_URL, {
          params: {
            buyToken: potentialTradeDetails.buyToken,
            sellToken: potentialTradeDetails.sellToken,
          },
        })
        .then((response) => {
          responses[id] = response;
        });
    });
    await Promise.allSettled(promises);
    return responses;
  }

  // TODO: implement
  async extractPrices(response: any): Promise<PricesObj> {
    const pricesObj: PricesObj = {};

    for (const id of Object.keys(response)) {
      const decimalPrice =
        Number(response[id].price) * Math.pow(10, -response[id].decimalPlaces);

      pricesObj[id] = parseFloat(decimalPrice.toFixed(8));
    }
    return pricesObj;
  }
}
