import fetchers from "../../src/fetchers/index";
import { getDeribitMockResponse } from "./mocks/responses/get-deribit-mock-response";
import { mockFetcherResponseOnceWithFunction } from "./_helpers";

jest.mock("axios");

const properTokens = [
  { symbol: "BTCDVOL", value: 50.81 },
  { symbol: "ETHDVOL", value: 56.81 },
];

const tokensSymbols = properTokens.map((token) => token.symbol);
const wrongToken = { symbol: "XX11DVOL", value: 0 };

function mock(tokens: { symbol: string; value: number }[]) {
  for (const token of tokens) {
    mockFetcherResponseOnceWithFunction(() => getDeribitMockResponse(token));
  }
}

jest.mock("axios");

describe("deribit fetcher", () => {
  const sut = fetchers["deribit"]!;

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
