import fetchers from "../../src/fetchers/index";
import { FetcherOpts } from "../../src/types";
import { mockFetcherResponse } from "./_helpers";
jest.mock("axios");

describe("CoinMarketCap fetcher", () => {
  const sut = fetchers["coinmarketcap"];

  beforeEach(() => {
    mockFetcherResponse(
      "../../src/fetchers/coinmarketcap/example-response.json"
    );
  });

  it("should properly fetch data", async () => {
    const result = await sut.fetchAll(["BTC", "ETH", "AVAX", "USDT"], {
      credentials: {
        coinmarketcapApiKey: "coinmarketcap-api-key",
      },
    } as FetcherOpts);
    expect(result).toEqual([
      {
        symbol: "BTC",
        value: 17719.583178051398,
      },
      {
        symbol: "ETH",
        value: 1329.6789589290904,
      },
      {
        symbol: "AVAX",
        value: 15.683797238052769,
      },
      {
        symbol: "USDT",
        value: 0.9978569770020286,
      },
    ]);
  });
});
