import axios, { AxiosResponse } from "axios";
import { PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";

interface NewyorkfedResponse {
  refRates: NewyorkfedRefRate[];
}

interface NewyorkfedRefRate {
  type: string;
  percentRate: number;
}

const NEWYORKFED_RATES_URL =
  "https://markets.newyorkfed.org/api/rates/all/latest.json";

export class NewyorkfedFetcher extends BaseFetcher {
  constructor() {
    super("newyorkfed");
  }

  fetchData(_ids: string[]) {
    return axios.get<NewyorkfedResponse>(NEWYORKFED_RATES_URL);
  }

  extractPrices(
    response: AxiosResponse<NewyorkfedResponse>,
    ids: string[]
  ): PricesObj {
    const pricesObj: PricesObj = {};

    for (const id of ids) {
      const rateFound = response.data.refRates.find((rate) => rate.type === id);
      if (rateFound) {
        pricesObj[id] = rateFound.percentRate;
      }
    }

    return pricesObj;
  }
}
