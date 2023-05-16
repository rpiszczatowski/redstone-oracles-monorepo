import { NewyorkfedResponse } from "../../types";

let lastNewYorkFedResponse: NewyorkfedResponse;

export const storeLastNewYorkFedResponse = (
  newLastNewYorkFedResponse: NewyorkfedResponse
) => {
  lastNewYorkFedResponse = newLastNewYorkFedResponse;
};

export const getLastNewYorkFedResponse = () => lastNewYorkFedResponse;
