import WebSocket from 'ws';
import exampleResponseJson from '../../../src/fetchers/binance/example-response.json';
import { createWsServer, WS_SERVER_PORT } from './ws-test-server-service';

jest.mock('../../../src/config', () => ({
    config: {
        binanceWsUrl: `ws://localhost:${WS_SERVER_PORT}`
    }
}));

import { BinanceWsFetcher } from '../../../src/fetchers/binance/BinanceWsFetcher';

jest.mock('uuid', () => ({
    // Mock the uuidv4 function to return a specific ID from the exampleResponseJson
    v4: jest.fn(() => exampleResponseJson.id)
}));

describe("binanceWs fetcher", () => {
    let server: WebSocket.Server;
    let binanceWsFetcher: BinanceWsFetcher;

    beforeEach(() => {
        server = createWsServer(exampleResponseJson);
        binanceWsFetcher = new BinanceWsFetcher();
    });

    afterEach(() => {
        binanceWsFetcher.disconnectWs();
        server.close();
    });

    it("should properly fetch data", async () => {
        // when
        const response = await binanceWsFetcher.fetchAll(['BTC', 'ETH', 'TRX']);

        // then
        expect(response).toEqual([
            {
                symbol: "BTC",
                value: "64452.00000000",
            },
            {
                symbol: "ETH",
                value: "3184.12000000",
            },
            {
                symbol: "TRX",
                value: "0.12930000",
            },
        ]);
    });

    it("should throw error when Binance WS response is not 200", async () => {
        // when and then
        exampleResponseJson.status = 400;
        try {
            await binanceWsFetcher.fetchAll(['BTC', 'ETH', 'TRX']);
            fail('Should throw error');
        } catch (err: any) {
            expect(err.message).toEqual(`[binanceWs] Binance response message has unexpected (error) response code: 400. Response message: ${JSON.stringify(exampleResponseJson)}`);
        }
    });
});
