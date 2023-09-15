import { PricesObj, PricesObjWithMetadata } from "../types";
import { stringifyError } from "../utils/error-stringifier";
import { BaseFetcher, normalizePriceObj } from "./BaseFetcher";

export interface RequestIdToResponse<T = unknown> {
  [requestId: string]: T | undefined;
}

interface ExtendedPromiseResult {
  response: unknown;
  requestId: string;
  success: boolean;
}

export abstract class MultiRequestFetcher extends BaseFetcher {
  abstract makeRequest(requestId: string): Promise<unknown>;
  abstract extractPrice(
    dataFeedId: string,
    responses: RequestIdToResponse
  ): PricesObjWithMetadata[string] | PricesObj[string] | undefined;

  // This function can be overriden to fetch more custom data
  // e.g. base prices required for final prices calculation
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  prepareRequestIds(requestedDataFeedIds: string[]): string[] {
    return requestedDataFeedIds;
  }

  // This method may be overridden to extend validation
  override validateResponse(responses: ExtendedPromiseResult[]): boolean {
    return responses.some(
      (singleResponse: ExtendedPromiseResult) => !!singleResponse.response
    );
  }

  async makeSafeRequest(requestId: string): Promise<ExtendedPromiseResult> {
    try {
      const response = await this.makeRequest(requestId);
      return {
        success: true,
        response,
        requestId,
      };
    } catch (e) {
      this.logger.error(`Request failed: ${requestId}. ${stringifyError(e)}`);
      return {
        requestId,
        success: false,
        response: stringifyError(e),
      };
    }
  }

  override async fetchData(
    dataFeedIds: string[]
  ): Promise<ExtendedPromiseResult[]> {
    const promises: Promise<ExtendedPromiseResult>[] = [];
    const requestIds = this.prepareRequestIds(dataFeedIds);

    for (const requestId of requestIds) {
      promises.push(this.makeSafeRequest(requestId));
    }

    return await Promise.all(promises);
  }

  override extractPrices(
    promisesResult: ExtendedPromiseResult[],
    dataFeedIds: string[]
  ): PricesObjWithMetadata {
    const pricesObj: PricesObjWithMetadata = {};
    const validResponses: RequestIdToResponse = {};

    // Building a mapping from successful request ids to corresponding responses
    for (const promiseResult of promisesResult) {
      if (promiseResult.success) {
        validResponses[promiseResult.requestId] = promiseResult.response;
      }
    }

    // Extracting price values for each symbol
    for (const dataFeedId of dataFeedIds) {
      try {
        const extractedPrice = this.extractPrice(dataFeedId, validResponses);
        // We don't log any error message if extractedPrice is undefined
        // Because the error will be logged by the BaseFetcher
        if (extractedPrice !== undefined) {
          pricesObj[dataFeedId] = normalizePriceObj(extractedPrice);
        }
      } catch (e) {
        this.logger.error(
          `Extracting price failed for: ${dataFeedId}. ${stringifyError(e)}`
        );
      }
    }

    return pricesObj;
  }
}
