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
    // Given
    mock(properTokens);

    // When
    const result = await sut.fetchAll(properTokens);

    // Then
    expect(result).toEqual(expectedResult);
  });

  it("should properly fetch data with one improper token", async () => {
    // Given
    let tokens = properTokens;
    properTokens.push(wrongToken);
    mock(tokens);

    // When
    const result = await sut.fetchAll(tokens);

    // Then
    expect(result).toEqual(expectedResult);
  });

  it("should properly fetch data with an improper token only", async () => {
    // Given
    mock([wrongToken]);

    // When
    const result = await sut.fetchAll([wrongToken]);

    // Then
    expect(result).toEqual([]);
  });
});
