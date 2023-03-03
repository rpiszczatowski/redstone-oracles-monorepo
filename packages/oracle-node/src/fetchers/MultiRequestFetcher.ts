import { BaseFetcher } from "./BaseFetcher";
import { PricesObj } from "../types";

export abstract class MultiRequestFetcher extends BaseFetcher {
  abstract processData(
    data: any,
    pricesObj: PricesObj,
    context?: any
  ): PricesObj;
  abstract makeRequest(id: string, context?: any): Promise<any>;

  protected getProcessingContext(): any {
    return undefined;
  }

  protected getRequestContext(ids: string[]): any {
    return undefined;
  }

  async fetchData(ids: string[]): Promise<any> {
    const context = await this.getRequestContext(ids);
    const promises: Promise<any>[] = [];

    for (const id of ids) {
      promises.push(this.makeRequest(id, context));
    }

    return Promise.allSettled(promises);
  }

  extractPrices(responses: any): PricesObj {
    let result: PricesObj = {};
    let context = this.getProcessingContext();

    for (const response of responses) {
      if (response.status === "rejected" || response.value === undefined) {
        continue;
      }

      result = this.processData(response.value, result, context);
    }

    return result;
  }
}
