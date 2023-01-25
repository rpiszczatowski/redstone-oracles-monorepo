import axios from "axios";
import lwapAggregator from "../../src/aggregators/lwap-aggregator";
import { PriceDataBeforeAggregation } from "../../src/types";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("lwapAggregator", () => {
  test("should throw error if no dex sources", async () => {
    const input: PriceDataBeforeAggregation = {
      id: "",
      source: {
        src1: 3,
        src2: 7,
        src3: 2,
      },
      symbol: "BTC",
      timestamp: 0,
      version: "",
    };
    await expect(lwapAggregator.getAggregatedValue(input)).rejects.toThrowError(
      "Cannot get LWAP value from empty array of values"
    );
  });

  test("should throw error if values from dex sources contain NaN", async () => {
    const inputWithNan: PriceDataBeforeAggregation = {
      id: "",
      source: {
        "trader-joe": 3,
        uniswap: NaN,
        src3: 2,
      },
      symbol: "BTC",
      timestamp: 0,
      version: "",
    };

    const inputWithError: PriceDataBeforeAggregation = {
      id: "",
      source: {
        "pangolin-wavax": 3,
        "trader-joe": 7,
        sushiswap: "error",
      },
      symbol: "BTC",
      timestamp: 0,
      version: "",
    };

    await expect(
      lwapAggregator.getAggregatedValue(inputWithNan)
    ).rejects.toThrowError(
      "Cannot get LWAP value of an array that contains NaN value"
    );

    await expect(
      lwapAggregator.getAggregatedValue(inputWithError)
    ).rejects.toThrowError(
      "Cannot get LWAP value of an array that contains NaN value"
    );
  });

  test("should throw error if liquidity from dex sources is NaN", async () => {
    mockedAxios.post.mockResolvedValue({
      data: { data: { pair: { reserveUSD: undefined } } },
    });
    const input: PriceDataBeforeAggregation = {
      id: "",
      source: {
        "trader-joe": 3,
        uniswap: 7,
        sushiswap: 2,
      },
      symbol: "BTC",
      timestamp: 0,
      version: "",
    };
    await expect(lwapAggregator.getAggregatedValue(input)).rejects.toThrowError(
      "Liquidity for BTC is NaN, cannot calculate LWAP."
    );
    mockedAxios.post.mockResolvedValue({
      data: { data: { errors: "" } },
    });
    await expect(lwapAggregator.getAggregatedValue(input)).rejects.toThrowError(
      "Liquidity for BTC is NaN, cannot calculate LWAP."
    );
  });

  test("should return the only source if one dex source", async () => {
    mockedAxios.post.mockResolvedValue({
      data: { data: { pair: { reserveUSD: "1000.43432" } } },
    });
    const input: PriceDataBeforeAggregation = {
      id: "",
      source: {
        "pangolin-usdc": 3.23,
        src1: 7,
        src2: 2,
      },
      symbol: "BTC",
      timestamp: 0,
      version: "",
    };

    const result = await lwapAggregator.getAggregatedValue(input);
    expect(result.value).toEqual(3.23);
  });

  test("should calculate lwap if more than one dex source", async () => {
    mockedAxios.post.mockResolvedValue({
      data: { data: { pair: { reserveUSD: "43542.3241241" } } },
    });
    const input: PriceDataBeforeAggregation = {
      id: "",
      source: {
        "pangolin-usdc": 3.23,
        uniswap: 4.676,
        sushiswap: 2.943,
        "trader-joe": 4.6546,
      },
      symbol: "BTC",
      timestamp: 0,
      version: "",
    };

    const result = await lwapAggregator.getAggregatedValue(input);
    expect(result.value).toEqual(3.8759);
  });
});
