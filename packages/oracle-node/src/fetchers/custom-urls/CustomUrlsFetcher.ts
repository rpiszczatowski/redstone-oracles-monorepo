import axios from "axios";
import jp from "jsonpath";
import { FetcherOpts, PricesObj } from "../../types";
import { BaseFetcher } from "../BaseFetcher";
import { RedstoneCommon } from "@redstone-finance/utils";

const CUSTOM_URL_REQUEST_TIMEOUT_MILLISECONDS = 10000;

export class CustomUrlsFetcher extends BaseFetcher {
  constructor() {
    super(`custom-urls`);
  }

  override async fetchData(ids: string[], opts: FetcherOpts) {
    const responses: Record<string, unknown> = {};
    const promises = [];

    for (const id of ids) {
      // TODO: maybe implement hash verification later

      const url = opts.manifest.tokens[id]!.customUrlDetails!.url;

      const promise = axios
        .get<unknown>(url, {
          timeout: CUSTOM_URL_REQUEST_TIMEOUT_MILLISECONDS,
        })
        .then((response) => {
          responses[id] = response.data;
        })
        .catch((err) => {
          const errMsg = RedstoneCommon.stringifyError(err);
          this.logger.error(
            `Request to url failed. Url: ${url} Error: ${errMsg}`
          );
        });
      promises.push(promise);
    }

    await Promise.allSettled(promises);

    return responses;
  }

  override extractPrices(
    responses: Record<string, unknown>,
    _ids: string[],
    opts: FetcherOpts
  ): PricesObj {
    return this.extractPricesSafely(
      Object.entries(responses),
      ([id, response]) => CustomUrlsFetcher.extractPricePair(opts, id, response)
    );
  }

  private static extractPricePair = (
    opts: FetcherOpts,
    id: string,
    response: unknown
  ) => {
    const jsonpath = opts.manifest.tokens[id]!.customUrlDetails!.jsonpath;
    const [extractedValue] = jp.query(response, jsonpath) as unknown[];
    let valueWithoutCommas = extractedValue;
    if (typeof extractedValue === "string") {
      valueWithoutCommas = extractedValue.replace(/,/g, "");
    }
    const extractedValueAsNumber = Number(valueWithoutCommas);
    const isEmptyString =
      typeof valueWithoutCommas === "string" && valueWithoutCommas.length === 0;
    if (isNaN(extractedValueAsNumber) || isEmptyString) {
      throw new Error(
        `Request to ${
          opts.manifest.tokens[id]!.customUrlDetails!.url
        } returned non-numeric value`
      );
    } else {
      return { value: extractedValueAsNumber, id };
    }
  };
}
