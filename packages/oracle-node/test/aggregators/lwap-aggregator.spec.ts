import lwapAggregator from "../../src/aggregators/lwap-aggregator/lwap-aggregator";
import { closeLocalLevelDB, setupLocalDb } from "../../src/db/local-db";
import {
  preparePrice,
  preparePrices,
  sanitizePrice,
} from "../fetchers/_helpers";

describe("lwapAggregator", () => {
  beforeAll(() => {
    setupLocalDb();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("should throw error if liquidities missing", () => {
    const input = sanitizePrice(
      preparePrice({
        source: {
          "trader-joe": 3,
          uniswap: 7,
          sushiswap: 2,
        },
        symbol: "WAVAX",
      })
    );
    const liquidities = preparePrices([
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
    ]);
    expect(() =>
      lwapAggregator.getAggregatedValue(input, liquidities)
    ).toThrowError(
      "Cannot calculate LWAP, missing liquidity for WAVAX_sushiswap"
    );
  });

  test("should throw error if liquidities contain NaN", () => {
    const input = sanitizePrice(
      preparePrice({
        source: {
          "pangolin-wavax": 3,
          "trader-joe": 7,
          sushiswap: 6,
        },
        symbol: "WAVAX",
      })
    );

    const liquidities = preparePrices([
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
    ]);

    expect(() =>
      lwapAggregator.getAggregatedValue(input, liquidities)
    ).toThrowError("Invalid number format");
  });

  test("should calculate lwap", () => {
    const input = sanitizePrice(
      preparePrice({
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
      })
    );

    const liquidities = preparePrices([
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
    ]);

    const result = lwapAggregator.getAggregatedValue(input, liquidities);
    expect(result.value.toString()).toEqual("3.17929111705599");
  });

  test("should throw if all liquidities are zero", () => {
    const input = sanitizePrice(
      preparePrice({
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
      })
    );

    const liquidities = preparePrices([
      {
        source: {
          "trader-joe": 0,
        },
        symbol: "WAVAX_trader-joe_liquidity",
      },
      {
        source: {
          uniswap: 0,
        },
        symbol: "WAVAX_uniswap_liquidity",
      },
      {
        source: {
          sushiswap: 0,
        },
        symbol: "WAVAX_sushiswap_liquidity",
      },
      {
        source: {
          uniswap: 0,
        },
        symbol: "WAVAX_pangolin-usdc_liquidity",
      },
    ]);

    expect(() =>
      lwapAggregator.getAggregatedValue(input, liquidities)
    ).toThrow();
  });
});
