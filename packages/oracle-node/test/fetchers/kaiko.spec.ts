import fetchers from "../../src/fetchers/index";
import { getKaikoMockResponse } from "./mocks/responses/get-kaiko-mock-response";
import { mockFetcherResponseOnceWithFunction } from "./_helpers";

jest.mock("axios");

const properTokens = [
  { symbol: "BTC", value: 16597.95607101699 },
  { symbol: "ETH", value: 1200.376158885697 },
  { symbol: "AAVE", value: 54.548738899642835 },
];

const tokensSymbols = properTokens.map((token) => token.symbol);
const wrongToken = { symbol: "XX11", value: 0 };

function mock(tokens: { symbol: string; value: number }[]) {
  for (const token of tokens) {
    mockFetcherResponseOnceWithFunction(() => getKaikoMockResponse(token));
  }
}

jest.mock("axios");

describe("kaiko fetcher", () => {
  const sut = fetchers["kaiko"];

  it("should properly fetch data with proper tokens", async () => {
    mock(properTokens);
    const result = await sut.fetchAll(tokensSymbols);
    expect(result).toEqual(properTokens);
  });

  it("should properly fetch data with one improper token", async () => {
    mock([...properTokens, wrongToken]);
    const result = await sut.fetchAll([...tokensSymbols, wrongToken.symbol]);
    expect(result).toEqual(properTokens);
  });

  it("should properly fetch data with an improper token only", async () => {
    mock([wrongToken]);
    const result = await sut.fetchAll([wrongToken.symbol]);
    expect(result).toEqual([]);
  });
});
