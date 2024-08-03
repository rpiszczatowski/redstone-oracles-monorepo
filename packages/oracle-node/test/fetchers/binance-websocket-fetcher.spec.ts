import { websocketMockClient } from "./mocks/websocket-mock-client";
import { BinancePriceWebSocketFetcher } from "../../src/fetchers/binance-websocket-fetcher/BinancePriceWebSocketFetcher";

const exampleAvgPriceResponse = {
  id: "043a7cf2-bde3-4888-9604-c8ac41fcba4d",
  status: 200,
  result: {
    symbol: "BTCUSDT",
    price: "61778.94000000",
  },
  rateLimits: [
    {
      rateLimitType: "REQUEST_WEIGHT",
      interval: "MINUTE",
      intervalNum: 1,
      limit: 6000,
      count: 4,
    },
  ],
};

jest.mock("../../src/fetchers/base-websocket-fetcher/WebSocketClient", () => {
  return {
    WebSocketClient: jest.fn().mockImplementation(() => websocketMockClient),
  };
});

jest.mock("uuid", () => ({
  v4: jest.fn(() => exampleAvgPriceResponse.id),
}));

describe("BinanceCurrentPriceWebSocketFetcher", () => {
  const wsClientOptions = { url: "wss://example.com" };
  const pendingResponseTimoutMs = 1000;

  test("should fetch price data", async () => {
    let onResponse = (data: any) => {};
    websocketMockClient.onResponse = jest
      .fn()
      .mockImplementation((callback) => {
        onResponse = callback;
      });

    const fetcher = new BinancePriceWebSocketFetcher(
      wsClientOptions,
      pendingResponseTimoutMs
    );

    websocketMockClient.sendMessage = jest
      .fn()
      .mockImplementation((message) => {
        onResponse(JSON.stringify(exampleAvgPriceResponse));
      });

    const btcPrice = exampleAvgPriceResponse.result.price;
    const res = await fetcher.fetchAll(["BTC"]);

    expect(res).toEqual([
      {
        symbol: "BTC",
        value: Number(btcPrice),
      },
    ]);
  });
});
