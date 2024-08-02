import WebSocket from 'ws';
import { BinanceWsService } from '../../../src/fetchers/binance/BinanceWsService';
import createLogger from '../../../src/utils/logger';
import { v4 as uuidv4 } from "uuid";
import exampleResponseJson from '../../../src/fetchers/binance/example-response.json';
import { createWsServer, WS_SERVER_PORT } from './ws-test-server-service';
import { sleep } from '../../../tools/common/sleep';

describe("BinanceWsService", () => {
    let server: WebSocket.Server;
    let binanceWsService: BinanceWsService;
    exampleResponseJson.id = uuidv4();
    beforeEach(() => {
        server = createWsServer(exampleResponseJson);
        binanceWsService = new BinanceWsService(createLogger("binance-ws-service.spec.ts"), `ws://localhost:${WS_SERVER_PORT}`);
    });

    afterEach(() => {
        binanceWsService.disconnect();
        server.close();
    });

    it("should send message and receive response message", async () => {
        // when
        const res = await binanceWsService.send({
            id: exampleResponseJson.id,
            method: "ticker.price",
            params: {
                symbols: ['BTC']
            }
        });

        // then
        expect(res).toEqual(exampleResponseJson);
    });

    it("should receive successful response message when WS client not yet connected (message is queued and resolved on re-connect)", async () => {
        // when
        server.close();
        const resPromise = binanceWsService.send({
            id: exampleResponseJson.id,
            method: "ticker.price",
            params: {
                symbols: ['BTC']
            }
        });
        await sleep(2000);
        server = createWsServer(exampleResponseJson);

        // when and then
        const res = await resPromise;
        expect(res).toEqual(exampleResponseJson);
    })

    it("should send message and throw error when response message status is 400", async () => {
        // given
        exampleResponseJson.status = 400;

        // when and then
        try {
            await binanceWsService.send({
                id: exampleResponseJson.id,
                method: "ticker.price",
                params: {
                    symbols: ['BTC']
                }
            });
            fail('Should throw error');
        } catch (err: any) {
            expect(err.message).toEqual(`Binance response message has unexpected (error) response code: 400. Response message: ${JSON.stringify(exampleResponseJson)}`);
        }
    });
});
