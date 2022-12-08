import { MockFetcher } from "../../src/fetchers/mock-fetcher/mock-fetcher";
import { PricesObj } from "../../src/types";

describe("mock fetcher", () => {
  const sut = new MockFetcher();
  beforeEach(() => {
    jest.spyOn(global.Math, "random").mockReturnValue(0.13);
  });

  afterEach(() => {
    jest.spyOn(global.Math, "random").mockRestore();
  });

  it("should properly load data from json", async () => {
    // Given
    const prices = [{ ETH: 90, AAVE: 10 }] as PricesObj[];
    sut.loadPrices(prices);
    // When
    const result = await sut.fetchAll(["ETH"]); //"AAVE", "UNI"]);

    // Then
    expect(result).toEqual([
      {
        symbol: "ETH",
        value: 90,
      },
    ]);
  });

  it("should properly load multiple token price data from json", async () => {
    // Given
    const prices = [{ ETH: 90, AAVE: 10 }, { ETH: 80 }] as PricesObj[];
    sut.loadPrices(prices);
    // When
    await sut.fetchAll(["ETH"]); //"AAVE", "UNI"]);
    const result = await sut.fetchAll(["ETH"]); //"AAVE", "UNI"]);

    // Then
    expect(result).toEqual([
      {
        symbol: "ETH",
        value: 80,
      },
    ]);
  });

  it("should properly load multiple token price multiple data from json", async () => {
    // Given
    const prices = [{ ETH: 90 }, { ETH: 80, AAVE: 10 }] as PricesObj[];
    sut.loadPrices(prices);
    // When
    await sut.fetchAll(["ETH", "AAVE"]);
    const result = await sut.fetchAll(["ETH", "AAVE"]);

    // Then
    expect(result).toEqual([
      {
        symbol: "ETH",
        value: 80,
      },
      {
        symbol: "AAVE",
        value: 10,
      },
    ]);
  });

  it("should properly set next price", async () => {
    // Given
    const nextPrices = { ETH: 90, AAVE: 20 };
    sut.setNextPrices(nextPrices);
    // When
    const result = await sut.fetchAll(["ETH", "AAVE"]);
    // Then
    expect(result).toEqual([
      {
        symbol: "ETH",
        value: 90,
      },
      {
        symbol: "AAVE",
        value: 20,
      },
    ]);
  });

  it("should return random prices when out of data", async () => {
    // Given
    const nextPrices = { ETH: 90, AAVE: 20 };
    sut.setNextPrices(nextPrices);
    // When
    await sut.fetchAll(["ETH", "AAVE"]);
    const result = await sut.fetchAll(["ETH", "AAVE"]);
    // Then
    expect(result).toEqual([
      {
        symbol: "ETH",
        value: 13,
      },
      {
        symbol: "AAVE",
        value: 13,
      },
    ]);
  });
});
