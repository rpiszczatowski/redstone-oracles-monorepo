import { LiquidityFetcher } from "../../src/fetchers/liquidity/LiquidityFetcher";
import { mockFetcherResponseOnce } from "./_helpers";

jest.mock("axios");

describe("liquidity fetcher", () => {
  const sut = new LiquidityFetcher();

  test("should properly fetch liquidity for single pair", async () => {
    mockFetcherResponseOnce("../../src/fetchers/uniswap/example-response.json");
    const result = await sut.fetchAll(["CREAM_uniswap_liquidity"]);
    expect(result).toEqual([
      {
        symbol: "CREAM_uniswap_liquidity",
        value: 368230.0035144528737697660266324149,
      },
    ]);
  });

  test("should properly fetch liquidity for multiple pairs and different dexs", async () => {
    mockFetcherResponseOnce("../../src/fetchers/uniswap/example-response.json");
    mockFetcherResponseOnce(
      "../../src/fetchers/sushiswap/example-response.json"
    );
    mockFetcherResponseOnce(
      "../../src/fetchers/trader-joe/example-response.json"
    );

    const result = await sut.fetchAll([
      "CREAM_uniswap_liquidity",
      "CREAM_sushiswap_liquidity",
      "JOE_trader-joe_liquidity",
      "CREAM_trader-joe_liquidity",
    ]);

    expect(result).toEqual([
      {
        symbol: "CREAM_uniswap_liquidity",
        value: 368230.0035144528737697660266324149,
      },
      {
        symbol: "CREAM_sushiswap_liquidity",
        value: 2193570.169109215159306550745326649,
      },
      {
        symbol: "JOE_trader-joe_liquidity",
        value: 27984492.96713477770644716027775813,
      },
    ]);
  });
});
