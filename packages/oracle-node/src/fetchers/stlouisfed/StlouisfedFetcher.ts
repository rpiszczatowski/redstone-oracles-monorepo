import axios, { AxiosResponse } from "axios";
import _ from "lodash";
import { PricesObj } from "../../types";
import symbolToId from "./symbol-to-series-id.json";
import { getRequiredPropValue } from "../../utils/objects";
import { config } from "../../config";
import { BaseFetcher } from "../BaseFetcher";
import { safelyConvertAnyValueToNumber } from "../../utils/numbers";

interface StlouisfedResponse {
  observations: StlouisfedObservation[];
}

interface StlouisfedObservation {
  date: string;
  value: string;
}

const idToSymbol = _.invert(symbolToId);
const STLOUISFED_OBERSVATIONS_URL =
  "https://api.stlouisfed.org/fred/series/observations";
const THE_ONLY_SUPPORTED_ID = "IUDSOIA";

export class StlouisfedFetcher extends BaseFetcher {
  constructor() {
    super("stlouisfed");
  }

  protected convertIdToSymbol(id: string): string {
    return getRequiredPropValue(idToSymbol, id);
  }

  protected convertSymbolToId(symbol: string): string {
    return getRequiredPropValue(symbolToId, symbol);
  }

  fetchData(ids: string[]) {
    if (ids.length != 1 || ids[0] !== THE_ONLY_SUPPORTED_ID) {
      throw new Error(
        `Only ${THE_ONLY_SUPPORTED_ID} is supported. Received: ${ids.join(",")}`
      );
    }
    return axios.get<StlouisfedResponse>(STLOUISFED_OBERSVATIONS_URL, {
      params: {
        series_id: ids[0],
        api_key: config.stlouisfedApiKey!,
        file_type: "json",
      },
    });
  }

  extractPrices(response: AxiosResponse<StlouisfedResponse>): PricesObj {
    const pricesObj: PricesObj = {};

    const lastObservation = _.last(response.data.observations)?.value;

    if (lastObservation) {
      pricesObj[THE_ONLY_SUPPORTED_ID] =
        safelyConvertAnyValueToNumber(lastObservation);
    }

    return pricesObj;
  }
}
