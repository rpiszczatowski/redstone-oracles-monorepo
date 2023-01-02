import fetchers from "../../src/fetchers/index";
import { mockFetcherResponseOnce } from "./_helpers";

const exampleResponsePathFormat =
  "../../src/fetchers/kaiko/example-responses/{id}.json";
const properTokens = ["BTC", "ETH", "AAVE"];
const wrongToken = "XX11";

const expectedResult = [
  {
    symbol: "BTC",
    value: 16597.95607101699,
  },
  {
    symbol: "ETH",
    value: 1200.376158885697,
  },
  {
    symbol: "AAVE",
    value: 54.548738899642835,
  },
];

function mock(tokens: string[]) {
  for (const token of tokens) {
    mockFetcherResponseOnce(exampleResponsePathFormat.replace("{id}", token));
  }
}

jest.mock("axios");

describe("kaiko fetcher", () => {
  const sut = fetchers["kaiko"];

  it("should properly fetch data with proper tokens", async () => {
    mock(properTokens);

    const result = await sut.fetchAll(properTokens);

    expect(result).toEqual(expectedResult);
  });

  it("should properly fetch data with one improper token", async () => {
    let tokens = properTokens;
    properTokens.push(wrongToken);
    mock(tokens);

    const result = await sut.fetchAll(tokens);

    expect(result).toEqual(expectedResult);
  });

  it("should properly fetch data with an improper token only", async () => {
    mock([wrongToken]);

    const result = await sut.fetchAll([wrongToken]);

    expect(result).toEqual([]);
  });
});
