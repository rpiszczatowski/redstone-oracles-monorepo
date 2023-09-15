import axios, { AxiosResponse } from "axios";
import { DateTime } from "luxon";
import { BaseFetcher } from "../BaseFetcher";
import { PricesObj } from "../../types";
import dataFeedsFunctionNames from "./data-feeds-function-names.json";
import { config } from "../../config";

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

const RATE_TYPE_REGEX = new RegExp("^([^_]+)_EFFECTIVE_DATE");

export class NewyorkfedFetcher extends BaseFetcher {
  constructor() {
    super("newyorkfed");
  }

  override async fetchData(_ids: NewyorkFedDataFeedsIds[]) {
    return await axios.get<NewyorkfedResponse>(config.newyorkfedRatesUrl);
  }

  override extractPrices(
    response: AxiosResponse<NewyorkfedResponse>,
    ids: NewyorkFedDataFeedsIds[]
  ): PricesObj {
    return this.extractPricesSafely(ids, (id) => {
      if (id.includes("EFFECTIVE_DATE")) {
        return NewyorkfedFetcher.extractEffectiveDateTimestamp(response, id);
      }
      return NewyorkfedFetcher.extractPricePair(response, id);
    });
  }

  private static extractPricePair(
    response: AxiosResponse<NewyorkfedResponse>,
    id: NewyorkFedDataFeedsIds
  ) {
    const rate = NewyorkfedFetcher.getRateFromResponse(response, id);
    const functionName = dataFeedsFunctionNames[id];
    const value = rate[functionName as NewyorkfedRefRateFunctionNames];
    return { value, id };
  }

  private static extractEffectiveDateTimestamp(
    response: AxiosResponse<NewyorkfedResponse>,
    id: NewyorkFedDataFeedsIds
  ) {
    const rateType =
      NewyorkfedFetcher.getRateTypeFromEffectiveDateDataFeedId(id);
    const rate = NewyorkfedFetcher.getRateFromResponse(response, rateType);
    const effectiveDate = rate.effectiveDate;
    const effectiveDateAsTimestamp =
      NewyorkfedFetcher.parseEffectiveDateToTimestamp(effectiveDate);
    return { value: effectiveDateAsTimestamp, id };
  }

  private static getRateFromResponse(
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

  private static getRateTypeFromEffectiveDateDataFeedId(
    id: NewyorkFedDataFeedsIds
  ) {
    const rateTypeRegexResult = id.match(RATE_TYPE_REGEX);
    if (!rateTypeRegexResult || rateTypeRegexResult.length < 2) {
      throw new Error(
        "Cannot extract rate type from effective date data feed id"
      );
    }
    return rateTypeRegexResult[1];
  }

  // We want effective date as timestamp with hour set to 8:00am EDT (New York timezone)
  private static parseEffectiveDateToTimestamp(effectiveDate: string) {
    return DateTime.fromISO(`${effectiveDate}T08:00:00.000`, {
      zone: "America/New_York",
    }).toSeconds();
  }
}
