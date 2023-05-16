import axios from "axios";
import {
  getLastNewYorkFedResponse,
  storeLastNewYorkFedResponse,
} from "../local-cache";
import { NewyorkfedResponse } from "../../types";
import { deepEqual } from "assert";

const NEWYORKFED_RATES_URL =
  "https://markets.newyorkfed.org/api/rates/all/latest.json";

export const changeInNewyorkfedResponseCondition = async () => {
  try {
    const response = await axios.get<NewyorkfedResponse>(NEWYORKFED_RATES_URL);
    const newYorkFedResponse = response.data;

    let shouldUpdatePrices = false;
    try {
      const lastNewYorkFedResponse = getLastNewYorkFedResponse();
      deepEqual(newYorkFedResponse, lastNewYorkFedResponse);
    } catch {
      shouldUpdatePrices = true;
      storeLastNewYorkFedResponse(newYorkFedResponse);
    }

    return {
      shouldUpdatePrices,
      warningMessage: shouldUpdatePrices
        ? ""
        : "Cached values and fetched from New York Fed are the same",
    };
  } catch {
    throw new Error("Cannot fetch and compare data from New York Fed");
  }
};
