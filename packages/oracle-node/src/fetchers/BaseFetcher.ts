import { Consola } from "consola";
import {
  Fetcher,
  FetcherOpts,
  PriceDataFetched,
  PriceDataFetchedValue,
  PricesObj,
  PricesObjWithMetadata,
} from "../types";
import { RedstoneCommon } from "@redstone-finance/utils";
import createLogger from "../utils/logger";
import { isDefined } from "../utils/objects";
import { WebSocketFetcher } from "./WebSocketFetcher";

const MAX_RESPONSE_TIME_TO_RETRY_FETCHING_MS = 3000;
export type ExtractPricePairFn<T> = (item: T) => {
  id: string;
  value: PriceDataFetchedValue;
};

export abstract class BaseFetcher implements Fetcher {
  protected name: string;
  protected logger: Consola;
  protected retryForInvalidResponse: boolean = false;
  protected webSocketFetcher?: WebSocketFetcher;

  protected constructor(name: string, wsUrl?: string, pingIntervalMs?: number) {
    this.name = name;
    this.logger = createLogger("fetchers/" + name);
    if (wsUrl && pingIntervalMs) {
      this.webSocketFetcher = new WebSocketFetcher(wsUrl, pingIntervalMs);
      this.setupListeners();
      this.webSocketFetcher.connect();
    }
  }

  // All the abstract methods below must be implemented in fetchers
  abstract fetchData(ids: string[], opts?: FetcherOpts): Promise<unknown>;
  abstract extractPrices(
    response: unknown,
    ids?: string[],
    opts?: FetcherOpts
  ): PricesObjWithMetadata | PricesObj;
  getSymbols?(): string[];

  // This method may be overridden to extend validation
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  validateResponse(response: unknown): boolean {
    return response !== undefined;
  }

  getName(): string {
    return this.name;
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  serializeResponse(response: unknown): string {
    return JSON.stringify(response);
  }

  private setupListeners() {
    if (!this.webSocketFetcher) return;

    this.webSocketFetcher.on("open", () => {
      if (this.getSymbols) {
        const symbols = this.getSymbols();
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.fetchData(symbols);
      }
    });
  }

  async fetchAll(
    symbols: string[],
    opts?: FetcherOpts
  ): Promise<PriceDataFetched[]> {
    const fetchStartTime = Date.now();
    const ids = symbols.map((symbol) => this.convertSymbolToId(symbol));

    // Initialize an empty PricesObjWithMetadata
    const pricesObj: PricesObjWithMetadata | PricesObj = {};
    // Fetch data via WebSocket if available
    if (this.webSocketFetcher) {
      this.logger.info("webSocketFetcher is available");
      const WsPricesObj = await this.webSocketFetchAll(ids, opts);
      Object.assign(pricesObj, WsPricesObj);
    }

    // Fetch data via HTTP
    else {
      const httpPricesObj = await this.httpFetchAll(ids, fetchStartTime, opts);
      Object.assign(pricesObj, httpPricesObj);
    }

    return this.convertPricesObjToResultPriceArray(pricesObj, ids);
  }

  private webSocketFetchAll = async (
    ids: string[],
    opts?: FetcherOpts
  ): Promise<PricesObjWithMetadata | PricesObj> => {
    const pricesObj: PricesObjWithMetadata | PricesObj = {};
    await this.fetchData(ids, opts);
    this.webSocketFetcher?.on("data", (data) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument
      const response = JSON.parse(data);
      const prices = this.extractPrices(response);
      Object.assign(pricesObj, prices);
    });

    return pricesObj;
  };

  private httpFetchAll = async (
    ids: string[],
    fetchStartTime: number,
    opts?: FetcherOpts
  ): Promise<PricesObjWithMetadata | PricesObj> => {
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
      throw new Error(
        `Response is invalid: ${this.serializeResponse(response)}`
      );
    }

    // Extracting prices from response
    return this.extractPrices(response, ids, opts);
  };

  // This method converts internal asset id (asset identifier on fetcher level)
  // to an asset symbol (asset identifier on manifest level)
  // It can be overridden by any fetcher
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected convertIdToSymbol(id: string): string {
    return id;
  }

  // This method converts asset symbol (asset identifier on manifest level)
  // to an internal asset id (asset identifier on fetcher level)
  // It can be overridden by any fetcher
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected convertSymbolToId(symbol: string): string {
    return symbol;
  }

  private convertPricesObjToResultPriceArray(
    pricesObj: PricesObjWithMetadata | PricesObj,
    requiredIds: string[]
  ): PriceDataFetched[] {
    const prices: PriceDataFetched[] = [];
    for (const id of requiredIds) {
      if (pricesObj[id] === undefined) {
        this.logger.warn(
          `Id ${id} is not included in response for: ${this.name}`
        );
      } else {
        prices.push({
          symbol: this.convertIdToSymbol(id),
          ...normalizePriceObj(pricesObj[id]),
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
          continue;
        }

        pricesObj[pricePair.id] = pricePair.value!;
      } catch (e) {
        this.logger.error(
          `Extracting price failed for id: ${id}, error: ${RedstoneCommon.stringifyError(
            e
          )}, item that failed: ${JSON.stringify(item)}`
        );
      }
    }

    return pricesObj;
  }
}

export const normalizePriceObj = (
  pricesObjValue: PricesObjWithMetadata[string] | PricesObj[string]
): PricesObjWithMetadata[string] => {
  if (pricesObjValue === null) {
    return { value: null };
  } else if (typeof pricesObjValue === "object") {
    return pricesObjValue;
  }
  return {
    value: pricesObjValue,
  };
};
