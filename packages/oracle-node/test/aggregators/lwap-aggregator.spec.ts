import lwapAggregator from "../../src/aggregators/lwap-aggregator/lwap-aggregator";
import { closeLocalLevelDB, setupLocalDb } from "../../src/db/local-db";
import { PriceDataBeforeAggregation } from "../../src/types";

describe("lwapAggregator", () => {
  beforeAll(() => {
    setupLocalDb();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("should throw error if liquidities missing", async () => {
    const input = {
      source: {
        "trader-joe": 3,
        uniswap: 7,
        sushiswap: 2,
      },
      symbol: "WAVAX",
    } as unknown as PriceDataBeforeAggregation;
    const liquidities = [
      {
        source: {
          "trader-joe": 43542.3241241,
        },
        symbol: "WAVAX_trader-joe_liquidity",
      },
      {
        source: {
          uniswap: 43542.3241241,
        },
        symbol: "WAVAX_uniswap_liquidity",
      },
    ] as unknown as PriceDataBeforeAggregation[];
    expect(() =>
      lwapAggregator.getAggregatedValue(input, liquidities)
    ).toThrowError(
      "Cannot calculate LWAP, missing liquidity for WAVAX_sushiswap"
    );
  });

  test("should throw error if prices from dex sources contain NaN", async () => {
    const inputWithNan = {
      source: {
        "trader-joe": 3,
        uniswap: NaN,
      },
      symbol: "WAVAX",
    } as unknown as PriceDataBeforeAggregation;

    const inputWithError = {
      source: {
        "pangolin-wavax": 3,
        "trader-joe": 7,
        sushiswap: "error",
      },
      symbol: "WAVAX",
    } as unknown as PriceDataBeforeAggregation;

    const liquidities = [
      {
        source: {
          "trader-joe": 43542.3241241,
        },
        symbol: "WAVAX_trader-joe_liquidity",
      },
      {
        source: {
          uniswap: 321.123,
        },
        symbol: "WAVAX_uniswap_liquidity",
      },
      {
        source: {
          uniswap: 12234.5467,
        },
        symbol: "WAVAX_sushiswap_liquidity",
      },
      {
        source: {
          uniswap: 234563.5467,
        },
        symbol: "WAVAX_pangolin-wavax_liquidity",
      },
    ] as unknown as PriceDataBeforeAggregation[];

    expect(() =>
      lwapAggregator.getAggregatedValue(inputWithNan, liquidities)
    ).toThrowError("Cannot get LWAP value if price is NaN value");

    expect(() =>
      lwapAggregator.getAggregatedValue(inputWithError, liquidities)
    ).toThrowError("Cannot get LWAP value if price is NaN value");
  });

  test("should throw error if liquidities contain NaN", async () => {
    const input = {
      source: {
        "pangolin-wavax": 3,
        "trader-joe": 7,
        sushiswap: 6,
      },
      symbol: "WAVAX",
    } as unknown as PriceDataBeforeAggregation;

    const liquidities = [
      {
        source: {
          "trader-joe": 43542.3241241,
        },
        symbol: "WAVAX_trader-joe_liquidity",
      },
      {
        source: {
          uniswap: NaN,
        },
        symbol: "WAVAX_sushiswap_liquidity",
      },
      {
        source: {
          uniswap: 234563.5467,
        },
        symbol: "WAVAX_pangolin-wavax_liquidity",
      },
    ] as unknown as PriceDataBeforeAggregation[];

    expect(() =>
      lwapAggregator.getAggregatedValue(input, liquidities)
    ).toThrowError("Cannot get LWAP value if liquidity is NaN value");
  });

  test("should calculate lwap", async () => {
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
    } as unknown as PriceDataBeforeAggregation;

    const liquidities = [
      {
        source: {
          "trader-joe": 32343.431989,
        },
        symbol: "WAVAX_trader-joe_liquidity",
      },
      {
        source: {
          uniswap: 123450.534543,
        },
        symbol: "WAVAX_uniswap_liquidity",
      },
      {
        source: {
          sushiswap: 993241.090542,
        },
        symbol: "WAVAX_sushiswap_liquidity",
      },
      {
        source: {
          uniswap: 43542.3241241,
        },
        symbol: "WAVAX_pangolin-usdc_liquidity",
      },
    ] as unknown as PriceDataBeforeAggregation[];

    const result = lwapAggregator.getAggregatedValue(input, liquidities);
    expect(result.value).toEqual(3.1792911170559917);
  });
});
