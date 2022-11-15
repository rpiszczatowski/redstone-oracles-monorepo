import { Consola } from "consola";
import { Fetcher, PriceDataFetched, FetcherOpts, PricesObj } from "../types";
import createLogger from "../utils/logger";
import { filterTokenToOverride } from "./override-token";

const MAX_RESPONSE_TIME_TO_RETRY_FETCHING_MS = 3000;

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
  ): Promise<PricesObj>;

  // This method may be overridden to extend validation
  validateResponse(response: any): boolean {
    return response !== undefined;
  }

  getName(): string {
    return this.name;
  }

  async fetchAll(
    symbols: string[],
    opts?: FetcherOpts
  ): Promise<PriceDataFetched[]> {
    // Fetching data
    const fetchStartTime = Date.now();
    const filteredSymbols = filterTokenToOverride(symbols);
    const filteredIds = filteredSymbols.map((symbol) =>
      this.convertSymbolToId(symbol)
    );
    let response = await this.fetchData(filteredIds, opts);

    // Retrying data fetching if needed
    const shouldRetry =
      !this.validateResponse(response) &&
      this.retryForInvalidResponse &&
      Date.now() - fetchStartTime <= MAX_RESPONSE_TIME_TO_RETRY_FETCHING_MS;
    if (shouldRetry) {
      this.logger.info("Retrying to fetch data");
      response = await this.fetchData(filteredIds, opts);
    }

    // Validating response
    const isValid = this.validateResponse(response);
    if (!isValid) {
      throw new Error(`Response is invalid: ` + JSON.stringify(response));
    }

    // Extracting prices from response
    const pricesObj = await this.extractPrices(response, filteredIds, opts);

    return this.convertPricesObjToResultPriceArray(pricesObj, filteredIds);
  }

  // This method converts internal asset id (asset identifier on fetcher level)
  // to an asset symbol (asset identifier on manifest level)
  // It can be overriden by any fetcher
  protected convertIdToSymbol(id: string): string {
    return id;
  }

  // This method converts asset symbol (asset identifier on manifest level)
  // to an internal asset id (asset identifier on fetcher level)
  // It can be overriden by any fetcher
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
}
