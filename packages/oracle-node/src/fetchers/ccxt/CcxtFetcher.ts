import _ from "lodash";
import ccxt, { Exchange, exchanges, Ticker } from "ccxt";
import { BaseFetcher } from "../BaseFetcher";
import { getLastPrice } from "../../db/local-db";
import { getRequiredPropValue } from "../../utils/objects";
import symbolToIdForExchanges from "./symbol-to-id/index";
import { PricesObj } from "../../types";

type Exchanges = keyof typeof exchanges;

const CCXT_FETCHER_MAX_REQUEST_TIMEOUT_MS = 120000;

export class CcxtFetcher extends BaseFetcher {
  private readonly exchange: Exchange;
  private readonly symbolToId;
  private readonly idToSymbol;

  // CCXT-based fetchers must have names that are exactly equal to
  // the appropriate exchange id in CCXT
  // List of ccxt exchanges: https://github.com/ccxt/ccxt/wiki/Exchange-Markets
  constructor(name: Exchanges) {
    super(name);
    const exchangeClass = ccxt[name];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!exchangeClass) {
      throw new Error(`Exchange ${name} is not accessible through CCXT`);
    }
    this.exchange = new exchangeClass({
      timeout: CCXT_FETCHER_MAX_REQUEST_TIMEOUT_MS,
      enableRateLimit: false, // This config option is required to avoid problems with requests timeout
    }) as Exchange;
    this.symbolToId = symbolToIdForExchanges[this.name as Exchanges]!;
    this.idToSymbol = _.invert(this.symbolToId);
  }

  override convertIdToSymbol(id: string) {
    return getRequiredPropValue<string>(this.idToSymbol, id);
  }

  override convertSymbolToId(symbol: string) {
    return getRequiredPropValue<string>(this.symbolToId, symbol);
  }

  override async fetchData(ids: string[]): Promise<unknown> {
    if (!this.exchange.has["fetchTickers"]) {
      throw new Error(
        `Exchange ${this.name} doesn't support fetchTickers method`
      );
    }

    return await this.exchange.fetchTickers(ids);
  }

  override extractPrices(response: Ticker[]): PricesObj {
    return this.extractPricesSafely(
      Object.values(response),
      CcxtFetcher.extractPricePair
    );
  }

  static extractPricePair = (ticker: Ticker) => {
    const pairSymbol = ticker.symbol;
    if (ticker.last === undefined) {
      throw new Error(`Price not returned for: ${pairSymbol}`);
    }
    const lastPrice = ticker.last;
    // Second condition is special case for binancecoinm
    if (pairSymbol.endsWith("/USD") || pairSymbol.includes("/USD:")) {
      return { value: lastPrice, id: pairSymbol };
    }
    const stableCoinSymbol = pairSymbol.slice(-4);
    const lastUsdInStablePrice = getLastPrice(stableCoinSymbol)?.value;
    if (lastUsdInStablePrice) {
      return { value: lastPrice * lastUsdInStablePrice, id: pairSymbol };
    }
    throw new Error(`Cannot get last price from cache for ${stableCoinSymbol}`);
  };
}
