import axios, { AxiosResponse } from "axios";
import { PricesObj } from "../../types";
import { stringifyError } from "../../utils/error-stringifier";
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
    return this.extractPricesSafely(ids, (id) =>
      this.extractPricePair(response, id)
    );
  }

  private extractPricePair(
    response: AxiosResponse<NewyorkfedResponse>,
    id: string
  ) {
    const rateFound = response.data.refRates.find((rate) => rate.type === id);
    if (rateFound) {
      return { value: rateFound.percentRate, id };
    } else {
      throw new Error(`Rate ${id} not found`);
    }
  }
}
