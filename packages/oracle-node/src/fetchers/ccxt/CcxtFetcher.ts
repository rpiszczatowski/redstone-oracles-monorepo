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
    return getRequiredPropValue(this.idToSymbol, id);
  }

  override convertSymbolToId(symbol: string) {
    return getRequiredPropValue(this.symbolToId, symbol);
  }

  async fetchData(ids: string[]): Promise<any> {
    if (!this.exchange.has["fetchTickers"]) {
      throw new Error(
        `Exchange ${this.name} doesn't support fetchTickers method`
      );
    }

    if (this.exchange.name === "Bybit") {
      return await this.handleRequestsForBybit(ids);
    }
    return await this.exchange.fetchTickers(ids);
  }

  extractPrices(response: any): PricesObj {
    return this.extractPricesSafely(
      Object.values(response) as Ticker[],
      this.extractPricePair.bind(this)
    );
  }

  private extractPricePair(ticker: Ticker) {
    const pairSymbol = ticker.symbol;
    if (ticker.last === undefined) {
      throw new Error(`Price not returned for: ${pairSymbol}`);
    }
    const lastPrice = ticker.last!;
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
  }

  async handleRequestsForBybit(ids: string[]) {
    const oldTypeIds = [];
    const newTypeIds = [];

    for (const id of ids) {
      if (id.includes("USDT:USDT")) {
        oldTypeIds.push(id);
      } else {
        newTypeIds.push(id);
      }
    }

    let responses = {};
    if (oldTypeIds.length > 0) {
      responses = await this.exchange.fetchTickers(oldTypeIds);
    }
    if (newTypeIds.length > 0) {
      responses = {
        ...responses,
        ...(await this.exchange.fetchTickers(newTypeIds)),
      };
    }
    return responses;
  }
}
