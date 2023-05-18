import axios, { AxiosResponse } from "axios";
import { DateTime } from "luxon";
import { BaseFetcher } from "../BaseFetcher";
import { PricesObj } from "../../types";
import dataFeedsFunctionNames from "./data-feeds-function-names.json";

interface NewyorkfedResponse {
  refRates: NewyorkfedRefRate[];
}

interface NewyorkfedRefRate {
  type: string;
  effectiveDate: string;
  percentRate?: number;
  index?: number;
}

type NewyorkFedDataFeedsIds = keyof typeof dataFeedsFunctionNames;
type NewyorkfedRefRateFunctionNames = "percentRate" | "index";

const NEWYORKFED_RATES_URL =
  "https://markets.newyorkfed.org/api/rates/all/latest.json";

const RATE_TYPE_REGEX = new RegExp("^([^_]+)_EFFECTIVE_DATE");

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
    return this.extractPricesSafely(ids, (id) => {
      if (id.includes("EFFECTIVE_DATE")) {
        return this.extractEffectiveDateTimestamp(response, id);
      }
      return this.extractPricePair(response, id);
    });
  }

  private extractPricePair(
    response: AxiosResponse<NewyorkfedResponse>,
    id: NewyorkFedDataFeedsIds
  ) {
    const rate = this.getRateFromResponse(response, id);
    const functionName = dataFeedsFunctionNames[id];
    const value = rate[functionName as NewyorkfedRefRateFunctionNames];
    return { value, id };
  }

  private extractEffectiveDateTimestamp(
    response: AxiosResponse<NewyorkfedResponse>,
    id: NewyorkFedDataFeedsIds
  ) {
    const rateType = this.getRateTypeFromEffectiveDateDataFeedId(id);
    const rate = this.getRateFromResponse(response, rateType);
    const effectiveDate = rate.effectiveDate;
    const effectiveDateAsTimestamp =
      this.parseEffectiveDateToTimestamp(effectiveDate);
    return { value: effectiveDateAsTimestamp, id };
  }

  private getRateFromResponse(
    response: AxiosResponse<NewyorkfedResponse>,
    rateType: string
  ) {
    const rateFound = response.data.refRates.find(
      (rate) => rate.type === rateType
    );
    if (!rateFound) {
      throw new Error(`Rate ${rateType} not found in New York Fed response`);
    }
    return rateFound;
  }

  private getRateTypeFromEffectiveDateDataFeedId(id: NewyorkFedDataFeedsIds) {
    const rateTypeRegexResult = id.match(RATE_TYPE_REGEX);
    if (!rateTypeRegexResult || rateTypeRegexResult?.length < 2) {
      throw new Error(
        "Cannot extract rate type from effective date data feed id"
      );
    }
    return rateTypeRegexResult[1];
  }

  // We want effective date as timestamp with hour set to 8:00am EDT (New York timezone)
  private parseEffectiveDateToTimestamp(effectiveDate: string) {
    return DateTime.fromISO(`${effectiveDate}T08:00:00.000`, {
      zone: "America/New_York",
    }).toSeconds();
  }
}
