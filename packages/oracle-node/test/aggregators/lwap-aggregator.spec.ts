import lwapAggregator from "../../src/aggregators/lwap/lwap-aggregator";
import { PriceDataBeforeAggregation } from "../../src/types";

describe("lwapAggregator", () => {
  test("should throw error if no dex sources", () => {
    const input: PriceDataBeforeAggregation = {
      id: "",
      source: {
        src1: 3,
        src2: 7,
        src3: 2,
      },
      symbol: "WAVAX",
      timestamp: 0,
      version: "",
    };
    expect(() => lwapAggregator.getAggregatedValue(input)).toThrowError(
      "Cannot get LWAP value from empty array of values"
    );
  });

  test("should throw error if values from dex sources contain NaN", () => {
    const inputWithNan: PriceDataBeforeAggregation = {
      id: "",
      source: {
        "trader-joe": 3,
        uniswap: NaN,
        src3: 2,
      },
      symbol: "WAVAX",
      timestamp: 0,
      version: "",
    };
    const liquidityPerSourceAndToken = {
      "trader-joe": { WAVAX: 43542.3241241 },
      "pangolin-wavax": { WAVAX: 321.123 },
      sushiswap: { WAVAX: 12234.5467 },
      uniswap: { WAVAX: 234563.5467 },
    };

    const inputWithError: PriceDataBeforeAggregation = {
      id: "",
      source: {
        "pangolin-wavax": 3,
        "trader-joe": 7,
        sushiswap: "error",
      },
      symbol: "WAVAX",
      timestamp: 0,
      version: "",
    };

    expect(() =>
      lwapAggregator.getAggregatedValue(
        inputWithNan,
        liquidityPerSourceAndToken
      )
    ).toThrowError("Cannot get LWAP value of an array that contains NaN value");

    expect(() =>
      lwapAggregator.getAggregatedValue(
        inputWithError,
        liquidityPerSourceAndToken
      )
    ).toThrowError("Cannot get LWAP value of an array that contains NaN value");
  });

  test("should throw error if no liquidation per source and token", () => {
    const input: PriceDataBeforeAggregation = {
      id: "",
      source: {
        "trader-joe": 3,
        uniswap: 7,
        sushiswap: 2,
      },
      symbol: "WAVAX",
      timestamp: 0,
      version: "",
    };
    expect(() => lwapAggregator.getAggregatedValue(input)).toThrowError(
      "Missing liquidation per source and token"
    );
  });

  test("should return the only source if one dex source", () => {
    const input: PriceDataBeforeAggregation = {
      id: "",
      source: {
        "pangolin-usdc": 3.23,
        src1: 7,
        src2: 2,
      },
      symbol: "WAVAX",
      timestamp: 0,
      version: "",
    };
    const liquidityPerSourceAndToken = {
      "pangolin-usdc": { WAVAX: 43542.3241241 },
    };
    const result = lwapAggregator.getAggregatedValue(
      input,
      liquidityPerSourceAndToken
    );
    expect(result.value).toEqual(3.23);
  });

  test("should calculate lwap if more than one dex source", () => {
    const liquidityPerSourceAndToken = {
      "pangolin-usdc": { WAVAX: 43542.3241241 },
      uniswap: { WAVAX: 123450.534543 },
      sushiswap: { WAVAX: 993241.090542 },
      "trader-joe": { WAVAX: 32343.431989 },
    };
    const input: PriceDataBeforeAggregation = {
      id: "",
      source: {
        "pangolin-usdc": 3.23,
        uniswap: 4.676,
        sushiswap: 2.943,
        "trader-joe": 4.6546,
      },
      symbol: "WAVAX",
      timestamp: 0,
      version: "",
    };

    const result = lwapAggregator.getAggregatedValue(
      input,
      liquidityPerSourceAndToken
    );
    expect(result.value).toEqual(3.1792911170559917);
  });
});
