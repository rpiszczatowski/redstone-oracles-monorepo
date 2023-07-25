import { Consola } from "consola";
import { Fetcher, PriceDataFetched, FetcherOpts, PricesObj } from "../types";
import { stringifyError } from "../utils/error-stringifier";
import createLogger from "../utils/logger";
import { isDefined } from "../utils/objects";

const MAX_RESPONSE_TIME_TO_RETRY_FETCHING_MS = 3000;
export type ExtractPricePairFn<T> = (item: T) => {
  id: string;
  value: number | undefined | null;
};

export abstract class BaseFetcher implements Fetcher {
  protected name: string;
  protected logger: Consola;
  protected retryForInvalidResponse: boolean = false;

  protected constructor(name: string) {
    this.name = name;
    this.logger = createLogger("fetchers/" + name);
  }

  // All the abstract methods below must be implemented in fetchers
  abstract fetchData(ids: string[], opts?: FetcherOpts): Promise<any>;
  abstract extractPrices(
    response: any,
    ids?: string[],
    opts?: FetcherOpts
  ): PricesObj;

  // This method may be overridden to extend validation
  validateResponse(response: any): boolean {
    return response !== undefined;
  }

  getName(): string {
    return this.name;
  }

  serializeResponse(response: any): string {
    return JSON.stringify(response);
  }

  async fetchAll(
    symbols: string[],
    opts?: FetcherOpts
  ): Promise<PriceDataFetched[]> {
    // Fetching data
    const fetchStartTime = Date.now();
    const ids = symbols.map((symbol) => this.convertSymbolToId(symbol));
    let response = await this.fetchData(ids, opts);

    // Retrying data fetching if needed
    const shouldRetry =
      !this.validateResponse(response) &&
      this.retryForInvalidResponse &&
      Date.now() - fetchStartTime <= MAX_RESPONSE_TIME_TO_RETRY_FETCHING_MS;
    if (shouldRetry) {
      this.logger.info("Retrying to fetch data");
      response = await this.fetchData(ids, opts);
    }

    // Validating response
    const isValid = this.validateResponse(response);
    if (!isValid) {
      throw new Error(`Response is invalid: ${this.serializeResponse(response)}`);
    }

    // Extracting prices from response
    const pricesObj = this.extractPrices(response, ids, opts);

    return this.convertPricesObjToResultPriceArray(pricesObj, ids);
  }

  // This method converts internal asset id (asset identifier on fetcher level)
  // to an asset symbol (asset identifier on manifest level)
  // It can be overridden by any fetcher
  protected convertIdToSymbol(id: string): string {
    return id;
  }

  // This method converts asset symbol (asset identifier on manifest level)
  // to an internal asset id (asset identifier on fetcher level)
  // It can be overridden by any fetcher
  protected convertSymbolToId(symbol: string): string {
    return symbol;
  }

  private convertPricesObjToResultPriceArray(
    pricesObj: PricesObj,
    requiredIds: string[]
  ): PriceDataFetched[] {
    const prices = [];
    for (const id of requiredIds) {
      if (pricesObj[id] === undefined) {
        this.logger.warn(
          `Id ${id} is not included in response for: ${this.name}`
        );
      } else {
        prices.push({
          symbol: this.convertIdToSymbol(id),
          value: pricesObj[id],
        });
      }
    }
    return prices;
  }

  /**
   * Function used to map items to pricesObj. Errors between extracts are isolated.
   * @param items list of objects that price and id will be extracted from
   * @param extractPricePairFn this function should extract price pair from item.
   *  If any of return values will be undefined or function wil throw, price pair
   * will not be added to result.
   * @returns pricesObj
   */
  protected extractPricesSafely<T>(
    items: T[],
    extractPricePairFn: ExtractPricePairFn<T>
  ): PricesObj {
    const pricesObj: PricesObj = {};
    for (const item of items) {
      let id;
      try {
        const pricePair = extractPricePairFn(item);

        if (!isDefined(pricePair)) {
          throw new Error("Could not extract price pair from response");
        }

        if (!isDefined(pricePair.id)) {
          throw new Error("Could not extract id from response");
        }
        id = pricePair.id;

        if (!isDefined(pricePair.value)) {
          throw new Error("Could not extract price from response");
        }

        if (isDefined(pricesObj[pricePair.id])) {
          // case were same id is extracted more than once
          continue;
        }

        pricesObj[pricePair.id] = pricePair.value!;
      } catch (e: unknown) {
        this.logger.error(
          `Extracting price failed for id: ${id}, error: ${stringifyError(e)}, item that failed: ${JSON.stringify(item)}`
        );
      }
    }

    return pricesObj;
  }
}
