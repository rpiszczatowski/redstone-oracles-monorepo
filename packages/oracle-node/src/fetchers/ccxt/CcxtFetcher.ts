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

  extractPrices(response: any): PricesObj {
    const pricesObj: PricesObj = {};

    for (const ticker of Object.values(response) as Ticker[]) {
      let pairSymbol = ticker.symbol;
      pairSymbol = this.serializePairSymbol(pairSymbol);
      const lastPrice = ticker.last as number;
      if (pairSymbol.endsWith("/USD")) {
        pricesObj[pairSymbol] = lastPrice;
      } else {
        if (!pricesObj[pairSymbol]) {
          const lastUsdInStablePrice = this.getStableCoinPrice(pairSymbol);
          if (lastUsdInStablePrice) {
            pricesObj[pairSymbol] = lastPrice * lastUsdInStablePrice;
          }
        }
      }
    }
    return pricesObj;
  }

  getStableCoinPrice(pairSymbol: string) {
    let stableCoinSymbol = pairSymbol.slice(-4);
    return getLastPrice(stableCoinSymbol)?.value;
  }

  serializePairSymbol(pairSymbol: string) {
    if (pairSymbol.endsWith("/USDT:USDT")) {
      return pairSymbol.replace("/USDT:USDT", "USDT");
    }
    return pairSymbol;
  }
}
