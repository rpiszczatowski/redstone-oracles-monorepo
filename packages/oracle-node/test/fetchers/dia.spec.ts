import fetchers from "../../src/fetchers/index";
import { mockFetcherResponseOnce } from "./_helpers";

const exampleResponsePathFormat =
  "../../src/fetchers/dia/example-responses/{id}.json";
const properTokens = ["ETH", "AAVE"];
const wrongToken = "XX11";

const expectedResult = [
  {
    symbol: "ETH",
    value: 1278.9030349377606,
  },
  {
    symbol: "AAVE",
    value: 64.75379202233283,
  },
];

function mock(tokens: string[]) {
  for (const token of tokens) {
    mockFetcherResponseOnce(exampleResponsePathFormat.replace("{id}", token));
  }
}

jest.mock("axios");

describe("dia fetcher", () => {
  const sut = fetchers["dia"];

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
