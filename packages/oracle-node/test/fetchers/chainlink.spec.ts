import fetchers from "../../src/fetchers/index";

jest.mock("../../src/fetchers/chainlink/ChainlinkProxy", () => {
  return jest.fn().mockImplementation(() => {
    return {
      getExchangeRates: () => {
        const exampleResponse = require("../../src/fetchers/chainlink/example-response.json");

        return Promise.resolve(exampleResponse);
      },
    };
  });
});

describe("chainlink fetcher", () => {
  const sut = fetchers["chainlink"];

  it("should properly fetch data", async () => {
    // Given

    // When
    const result = await sut.fetchAll(["ETH", "AAVE", "UNI"]);

    // Then
    expect(result).toEqual([
      {
        symbol: "ETH",
        value: 1271.86,
      },
      {
        symbol: "AAVE",
        value: 66.57,
      },
      {
        symbol: "UNI",
        value: 5.72,
      },
    ]);
  });
});
