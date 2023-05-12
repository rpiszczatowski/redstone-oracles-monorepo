import axios, { AxiosResponse } from "axios";
import { PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";
import dataFeedsFunctionNames from "./data-feeds-function-names.json";

interface NewyorkfedResponse {
  refRates: NewyorkfedRefRate[];
}

interface NewyorkfedRefRate {
  type: string;
  percentRate?: number;
  index?: number;
}

type NewyorkFedDataFeedsIds = keyof typeof dataFeedsFunctionNames;
type NewyorkfedRefRateFunctionNames = "percentRate" | "index";

const NEWYORKFED_RATES_URL =
  "https://markets.newyorkfed.org/api/rates/all/latest.json";

export class NewyorkfedFetcher extends BaseFetcher {
  constructor() {
    super("newyorkfed");
  }

  fetchData(_ids: NewyorkFedDataFeedsIds[]) {
    return axios.get<NewyorkfedResponse>(NEWYORKFED_RATES_URL);
  }

  extractPrices(
    response: AxiosResponse<NewyorkfedResponse>,
    ids: NewyorkFedDataFeedsIds[]
  ): PricesObj {
    return this.extractPricesSafely(ids, (id) =>
      this.extractPricePair(response, id)
    );
  }

  private extractPricePair(
    response: AxiosResponse<NewyorkfedResponse>,
    id: NewyorkFedDataFeedsIds
  ) {
    const rateFound = response.data.refRates.find((rate) => rate.type === id);
    if (rateFound) {
      const functionName = dataFeedsFunctionNames[id];
      const value = rateFound[functionName as NewyorkfedRefRateFunctionNames];
      return { value, id };
    } else {
      throw new Error(`Rate ${id} not found`);
    }
  }
}
