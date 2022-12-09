import { MockFetcher } from "../../src/fetchers/mock-fetcher/mock-fetcher";
import { mockFetcherResponse } from "./_helpers";

jest.mock("axios");

describe("mock fetcher", () => {
  const sut = new MockFetcher();

  beforeEach(() => {
    mockFetcherResponse(
      "../../src/fetchers/mock-fetcher/example-response.json"
    );
  });

  it("should properly fetch data from URL", async () => {
    // Given
    // When
    const result = await sut.fetchAll(["ETH"]);
    // Then
    expect(result).toEqual([
      {
        symbol: "ETH",
        value: 1500,
      },
    ]);
  });

  it("should properly fetch default data from URL when no price for token present", async () => {
    // Given
    // When
    const result = await sut.fetchAll(["UNI", "AAVE"]);
    // Then
    expect(result).toEqual([
      {
        symbol: "UNI",
        value: 6.2,
      },
      {
        symbol: "AAVE",
        value: 42,
      },
    ]);
  });
});
