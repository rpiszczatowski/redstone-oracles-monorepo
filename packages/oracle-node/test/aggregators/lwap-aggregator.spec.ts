import lwapAggregator from "../../src/aggregators/lwap-aggregator/lwap-aggregator";
import { closeLocalLevelDB, setupLocalDb } from "../../src/db/local-db";
import { PriceDataBeforeAggregation } from "../../src/types";
import { saveMockPricesInLocalDb } from "../fetchers/_helpers";

describe("lwapAggregator", () => {
  beforeAll(() => {
    setupLocalDb();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("should throw error if liquidities missing", async () => {
    await saveMockPricesInLocalDb(
      [43542.3241241, 43542.3241241],
      ["WAVAX_trader-joe_liquidity", "WAVAX_uniswap_liquidity"]
    );
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
      "Cannot calculate LWAP, missing liquidity for WAVAX_sushiswap"
    );
  });

  test("should throw error if prices from dex sources contain NaN", async () => {
    await saveMockPricesInLocalDb(
      [43542.3241241, 321.123, 12234.5467, 234563.5467],
      [
        "WAVAX_trader-joe_liquidity",
        "WAVAX_uniswap_liquidity",
        "WAVAX_sushiswap_liquidity",
        "WAVAX_pangolin-wavax_liquidity",
      ]
    );

    const inputWithNan: PriceDataBeforeAggregation = {
      id: "",
      source: {
        "trader-joe": 3,
        uniswap: NaN,
      },
      symbol: "WAVAX",
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
      symbol: "WAVAX",
      timestamp: 0,
      version: "",
    };

    expect(() => lwapAggregator.getAggregatedValue(inputWithNan)).toThrowError(
      "Cannot get LWAP value if price is NaN value"
    );

    expect(() =>
      lwapAggregator.getAggregatedValue(inputWithError)
    ).toThrowError("Cannot get LWAP value if price is NaN value");
  });

  test("should throw error if liquidities contain NaN", async () => {
    await saveMockPricesInLocalDb(
      [43542.3241241, NaN, 234563.5467],
      [
        "WAVAX_trader-joe_liquidity",
        "WAVAX_sushiswap_liquidity",
        "WAVAX_pangolin-wavax_liquidity",
      ]
    );

    const input: PriceDataBeforeAggregation = {
      id: "",
      source: {
        "pangolin-wavax": 3,
        "trader-joe": 7,
        sushiswap: 6,
      },
      symbol: "WAVAX",
      timestamp: 0,
      version: "",
    };

    expect(() => lwapAggregator.getAggregatedValue(input)).toThrowError(
      "Cannot get LWAP value if liquidity is NaN value"
    );
  });

  test("should calculate lwap", async () => {
    await saveMockPricesInLocalDb(
      [32343.431989, 123450.534543, 993241.090542, 43542.3241241],
      [
        "WAVAX_trader-joe_liquidity",
        "WAVAX_uniswap_liquidity",
        "WAVAX_sushiswap_liquidity",
        "WAVAX_pangolin-usdc_liquidity",
      ]
    );

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

    const result = lwapAggregator.getAggregatedValue(input);
    expect(result.value).toEqual(3.1792911170559917);
  });
});
