process.env.BINANCE_WEBSOCKET_API_URL = "ws://localhost:1234"; // must be called before imports to override API URL

import fetchers from "../../src/fetchers/index";
import {
  BinanceRequest,
  BinanceTickersResponse,
} from "../../src/fetchers/binance/BinanceClient";
import { mockWsFetcherResponse } from "./_helpers";

mockWsFetcherResponse<BinanceRequest, BinanceTickersResponse>(
  1234,
  (request: BinanceRequest) => {
    const response =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("../../src/fetchers/binance/example-response.json") as BinanceTickersResponse;
    response.id = request.id;

    return response;
  }
);

describe("binance fetcher", () => {
  const sut = fetchers["binance-ws"]!;

  it("should properly fetch data", async () => {
    const result = await sut.fetchAll(["BTC", "ETH", "AR"]);

    expect(result).toEqual([
      {
        symbol: "BTC",
        value: 38190,
      },
      {
        symbol: "ETH",
        value: 2704.39,
      },
      {
        symbol: "AR",
        value: 17.46,
      },
    ]);
  });
});
