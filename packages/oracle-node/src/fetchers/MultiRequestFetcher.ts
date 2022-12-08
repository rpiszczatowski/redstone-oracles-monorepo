import { BaseFetcher } from "./BaseFetcher";
import { PricesObj } from "../types";

export abstract class MultiRequestFetcher extends BaseFetcher {
  abstract processData(
    data: any,
    pricesObj: PricesObj,
    context?: any
  ): PricesObj;
  abstract makeRequest(id: string, context?: any): Promise<any>;

  getProcessingContext(): any {
    return undefined;
  }

  getRequestContext(): any {
    return undefined;
  }

  async fetchData(ids: string[]): Promise<any> {
    const context = await this.getRequestContext();
    const promises: Promise<any>[] = [];

    for (const id of ids) {
      promises.push(this.makeRequest(id, context));
    }

    return Promise.allSettled(promises);
  }

  async extractPrices(responses: any): Promise<PricesObj> {
    let result: PricesObj = {};
    let context = await this.getProcessingContext();

    for (const response of responses) {
      if (
        response.status === "rejected" ||
        response.value === undefined ||
        response.value.data === undefined
      ) {
        continue;
      }

      result = this.processData(response.value.data, result, context);
    }

    return result;
  }
}
