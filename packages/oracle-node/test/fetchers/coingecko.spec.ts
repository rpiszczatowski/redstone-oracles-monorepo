import fetchers from "../../src/fetchers/index";
import { mockFetcherResponse } from "./_helpers";

jest.mock("axios");

mockFetcherResponse("../../src/fetchers/coingecko/example-response.json");

describe("coingecko fetcher", () => {
  const sut = fetchers["coingecko"]!;

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
