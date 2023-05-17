import fetchers from "../../src/fetchers/index";
import { mockFetcherResponse } from "./_helpers";

jest.mock("axios");

describe("newyorkfed fetcher", () => {
  const sut = fetchers["newyorkfed"];

  beforeEach(() => {
    mockFetcherResponse("../../src/fetchers/newyorkfed/example-response.json");
  });

  it("should properly fetch data", async () => {
    const result = await sut.fetchAll(["SOFR"]);
    expect(result).toEqual([
      {
        symbol: "SOFR",
        value: 4.55,
      },
    ]);
  });

  it("should properly fetch data", async () => {
    const result = await sut.fetchAll(["SOFRAI"]);
    expect(result).toEqual([
      {
        symbol: "SOFRAI",
        value: 1.06870893,
      },
    ]);
  });
});
