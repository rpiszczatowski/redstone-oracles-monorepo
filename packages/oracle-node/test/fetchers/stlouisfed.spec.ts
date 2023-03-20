import fetchers from "../../src/fetchers/index";
import { mockFetcherResponse } from "./_helpers";

jest.mock("axios");

describe("stlouisfed fetcher", () => {
  const sut = fetchers["stlouisfed"];

  beforeEach(() => {
    mockFetcherResponse("../../src/fetchers/stlouisfed/example-response.json");
  });

  it("should properly fetch data", async () => {
    const result = await sut.fetchAll(["SONIA"]);
    expect(result).toEqual([
      {
        symbol: "SONIA",
        value: 3.9275,
      },
    ]);
  });
});
