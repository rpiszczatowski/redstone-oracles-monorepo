import fetchers from "../../src/fetchers/index";
import { mockFetcherResponse } from "./_helpers";

jest.mock("axios");

mockFetcherResponse("../../src/fetchers/band/example-response.json");

describe("band fetcher", () => {
  const sut = fetchers["band"];

  it("should properly fetch data", async () => {
    const result = await sut.fetchAll(["BTC", "ETH", "AAVE", "UNI"]);

    expect(result).toEqual([
      {
        symbol: "BTC",
        value: 16841.535,
      },
      {
        symbol: "ETH",
        value: 1233.22681426,
      },
      {
        symbol: "AAVE",
        value: 62.317499999,
      },
      {
        symbol: "UNI",
        value: 5.999859751,
      },
    ]);
  });
});
