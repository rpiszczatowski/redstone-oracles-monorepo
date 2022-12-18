import _ from "lodash";
import ccxt, { Exchange, Ticker } from "ccxt";
import { BaseFetcher } from "../BaseFetcher";
import { getLastPrice } from "../../db/local-db";
import { getRequiredPropValue } from "../../utils/objects";
import symbolToIdForExchanges from "./symbol-to-id/index";
import { PricesObj } from "../../types";

const CCXT_FETCHER_MAX_REQUEST_TIMEOUT_MS = 120000;

export class CcxtFetcher extends BaseFetcher {
  private readonly exchange: Exchange;
  private readonly symbolToId;
  private readonly idToSymbol;

  // CCXT-based fetchers must have names that are exactly equal to
  // the appropriate exchange id in CCXT
  // List of ccxt exchanges: https://github.com/ccxt/ccxt/wiki/Exchange-Markets
  constructor(name: ccxt.ExchangeId) {
    super(name);
    const exchangeClass = ccxt[name];
    if (!exchangeClass) {
      throw new Error(`Exchange ${name} is not accessible through CCXT`);
    }
    this.exchange = new exchangeClass({
      timeout: CCXT_FETCHER_MAX_REQUEST_TIMEOUT_MS,
      enableRateLimit: false, // This config option is required to avoid problems with requests timeout
    }) as Exchange;
    this.symbolToId = symbolToIdForExchanges[this.name as ccxt.ExchangeId]!;
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

    // If we pass undefined as tickerSymbols then all available tickers will be loaded
    // But some exchanges (like kraken) do not support this anymore
    return await this.exchange.fetchTickers(ids);
  }

  async extractPrices(response: any): Promise<PricesObj> {
    const lastUsdtPrice = getLastPrice("USDT")?.value;
    const lastBusdPrice = getLastPrice("BUSD")?.value;

    const pricesObj: PricesObj = {};

    for (const ticker of Object.values(response) as Ticker[]) {
      let pairSymbol = ticker.symbol;
      pairSymbol = this.serializePairSymbol(pairSymbol);
      const lastPrice = ticker.last as number;
      const isSymbolInUsdt =
        pairSymbol.endsWith("/USDT") || pairSymbol.endsWith("USDT");
      const isSymbolInBusd = pairSymbol.endsWith("/BUSD");
      if (pairSymbol.endsWith("/USD")) {
        pricesObj[pairSymbol] = lastPrice;
      } else if (isSymbolInUsdt || isSymbolInBusd) {
        if (!pricesObj[pairSymbol]) {
          const lastUsdInStablePrice = isSymbolInUsdt
            ? lastUsdtPrice
            : lastBusdPrice;
          if (lastUsdInStablePrice) {
            pricesObj[pairSymbol] = lastPrice * lastUsdInStablePrice;
          }
        }
      }
    }
    return pricesObj;
  }

  serializePairSymbol(pairSymbol: string) {
    if (pairSymbol.endsWith("/USDT:USDT")) {
      return pairSymbol.replace("/USDT:USDT", "USDT");
    }
    return pairSymbol;
  }
}
