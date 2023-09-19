import fetchers from "../../src/fetchers/index";
import { mockFetcherResponse } from "./_helpers";

jest.mock("axios");

describe("newyorkfed fetcher", () => {
  const sut = fetchers["newyorkfed"]!;

  beforeEach(() => {
    mockFetcherResponse("../../src/fetchers/newyorkfed/example-response.json");
  });

  it("should properly fetch SOFR data feed", async () => {
    const result = await sut.fetchAll(["SOFR"]);
    expect(result).toEqual([
      {
        symbol: "SOFR",
        value: 4.55,
      },
    ]);
  });

  it("should properly fetch SOFRAI data feed", async () => {
    const result = await sut.fetchAll(["SOFRAI"]);
    expect(result).toEqual([
      {
        symbol: "SOFRAI",
        value: 1.06870893,
      },
    ]);
  });

  it("should properly fetch effective date data feeds", async () => {
    const result = await sut.fetchAll([
      "SOFR_EFFECTIVE_DATE",
      "SOFRAI_EFFECTIVE_DATE",
    ]);
    expect(result).toEqual([
      {
        symbol: "SOFR_EFFECTIVE_DATE",
        value: 1678280400,
      },
      {
        symbol: "SOFRAI_EFFECTIVE_DATE",
        value: 1678366800,
      },
    ]);
  });
});
