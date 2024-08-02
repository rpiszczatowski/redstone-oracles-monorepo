import { PricesObj } from '../../types';
import { BaseFetcher } from '../BaseFetcher';
import { BinanceWsPriceRequest, BinanceWsPriceResult, BinanceWsService } from './BinanceWsService';
import { v4 as uuidv4 } from "uuid";
import { config } from '../../config';

// It automatically connects to Binance WS after first fetchData function call
// 1st fetchData call can have 2-3 seconds delay.
// WS connection is maintained by BinanceWsService (auto-reconnect, error handling, etc.).
// 1 instance = 1 WS connection to Binance
export class BinanceWsFetcher extends BaseFetcher {

    private readonly binanceWsService: BinanceWsService;
    // Binance supports USDT as base currency
    private readonly baseCurrency = 'USDT';

    constructor() {
        super('binanceWs');
        this.binanceWsService = new BinanceWsService(this.logger, config.binanceWsUrl);
    }

    override async fetchData(ids: string[]): Promise<BinanceWsPriceResult[]> {
        return (await this.binanceWsService.send(
            new BinanceWsPriceRequest(uuidv4(), ids,))).result;
    }

    protected override convertIdToSymbol(id: string): string {
        return id.substring(0, id.length - this.baseCurrency.length);
    }

    protected override convertSymbolToId(symbol: string): string {
        return `${symbol.toUpperCase()}${this.baseCurrency}`;
    }

    override extractPrices(binanceWsSymbolResults: BinanceWsPriceResult[]): PricesObj {
        const pricesObj: PricesObj = {};
        binanceWsSymbolResults.forEach(_ => pricesObj[_.symbol] = _.price);
        return pricesObj;
    }

    public disconnectWs(): void {
        this.binanceWsService.disconnect();
    }
}