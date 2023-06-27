import { BaseFetcher } from "./BaseFetcher";
import { PricesObj } from "../types";
import { stringifyError } from "../utils/error-stringifier";

export interface RequestIdToResponse {
  [requestId: string]: any;
}

interface ExtendedPromiseResult {
  response: any;
  requestId: string;
  success: boolean;
}

export abstract class MultiRequestFetcher extends BaseFetcher {
  abstract makeRequest(requestId: string): Promise<any>;
  abstract extractPrice(
    dataFeedId: string,
    responses: RequestIdToResponse
  ): number | undefined;

  // This function can be overriden to fetch more custom data
  // e.g. base prices required for final prices calculation
  prepareRequestIds(requestedDataFeedIds: string[]): string[] {
    return requestedDataFeedIds;
  }

  // This method may be overridden to extend validation
  validateResponse(responses: ExtendedPromiseResult[]): boolean {
    return (
      responses !== undefined &&
      responses.some(
        (singleResponse: ExtendedPromiseResult) => !!singleResponse.response
      )
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
    } catch (e: any) {
      this.logger.error(`Request failed: ${requestId}. ${stringifyError(e)}`);
      return {
        requestId,
        success: false,
        response: undefined,
      };
    }
  }

  override fetchData(dataFeedIds: string[]): Promise<ExtendedPromiseResult[]> {
    const promises: Promise<any>[] = [];
    const requestIds = this.prepareRequestIds(dataFeedIds);

    for (const requestId of requestIds) {
      promises.push(this.makeSafeRequest(requestId));
    }

    return Promise.all(promises);
  }

  override extractPrices(
    promisesResult: ExtendedPromiseResult[],
    dataFeedIds: string[]
  ): PricesObj {
    let pricesObj: PricesObj = {};
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
          pricesObj[dataFeedId] = extractedPrice;
        }
      } catch (e: any) {
        this.logger.error(
          `Extracting price failed for: ${dataFeedId}. ${stringifyError(e)}`
        );
      }
    }

    return pricesObj;
  }
}
