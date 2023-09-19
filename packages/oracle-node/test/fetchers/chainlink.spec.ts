import fetchers from "../../src/fetchers/index";
import exampleResponse from "../../src/fetchers/chainlink/example-response.json";

jest.mock("../../src/fetchers/chainlink/ChainlinkProxy", () => {
  return jest.fn().mockImplementation(() => {
    return {
      getExchangeRates: () => {
        return Promise.resolve(exampleResponse);
      },
    };
  });
});

describe("chainlink fetcher", () => {
  const sut = fetchers["chainlink"]!;

  it("should properly fetch data", async () => {
    // Given

    // When
    const result = await sut.fetchAll(["ETH", "AAVE", "UNI"]);

    // Then
    expect(result).toEqual([
      {
        symbol: "ETH",
        value: 1271.86299316,
      },
      {
        symbol: "AAVE",
        value: 66.56718628,
      },
      {
        symbol: "UNI",
        value: 5.72036243,
      },
    ]);
  });
});
