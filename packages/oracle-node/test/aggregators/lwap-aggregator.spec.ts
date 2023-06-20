import lwapAggregator from "../../src/aggregators/lwap-aggregator/lwap-aggregator";
import { closeLocalLevelDB, setupLocalDb } from "../../src/db/local-db";
import { createSafeNumber } from "../../src/numbers/SafeNumberFactory";
import {
  PriceDataBeforeAggregation,
  SanitizedPriceDataBeforeAggregation,
} from "../../src/types";

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
        "trader-joe": createSafeNumber(3),
        uniswap: createSafeNumber(7),
        sushiswap: createSafeNumber(2),
      },
      symbol: "WAVAX",
    } as unknown as SanitizedPriceDataBeforeAggregation;
    const liquidities = [
      {
        source: {
          "trader-joe": createSafeNumber(43542.3241241),
        },
        symbol: "WAVAX_trader-joe_liquidity",
      },
      {
        source: {
          uniswap: createSafeNumber(43542.3241241),
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

  test("should throw error if liquidities contain NaN", async () => {
    const input = {
      source: {
        "pangolin-wavax": createSafeNumber(3),
        "trader-joe": createSafeNumber(7),
        sushiswap: createSafeNumber(6),
      },
      symbol: "WAVAX",
    } as unknown as SanitizedPriceDataBeforeAggregation;

    const liquidities = [
      {
        source: {
          "trader-joe": createSafeNumber(43542.3241241),
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
          uniswap: createSafeNumber(234563.5467),
        },
        symbol: "WAVAX_pangolin-wavax_liquidity",
      },
    ] as unknown as PriceDataBeforeAggregation[];

    expect(() =>
      lwapAggregator.getAggregatedValue(input, liquidities)
    ).toThrowError("Invalid number format");
  });

  test("should calculate lwap", async () => {
    const input = {
      id: "",
      source: {
        "pangolin-usdc": createSafeNumber(3.23),
        uniswap: createSafeNumber(4.676),
        sushiswap: createSafeNumber(2.943),
        "trader-joe": createSafeNumber(4.6546),
      },
      symbol: "WAVAX",
      timestamp: 0,
      version: "",
    } as unknown as SanitizedPriceDataBeforeAggregation;

    const liquidities = [
      {
        source: {
          "trader-joe": createSafeNumber(32343.431989),
        },
        symbol: "WAVAX_trader-joe_liquidity",
      },
      {
        source: {
          uniswap: createSafeNumber(123450.534543),
        },
        symbol: "WAVAX_uniswap_liquidity",
      },
      {
        source: {
          sushiswap: createSafeNumber(993241.090542),
        },
        symbol: "WAVAX_sushiswap_liquidity",
      },
      {
        source: {
          uniswap: createSafeNumber(43542.3241241),
        },
        symbol: "WAVAX_pangolin-usdc_liquidity",
      },
    ] as unknown as PriceDataBeforeAggregation<number>[];

    const result = lwapAggregator.getAggregatedValue(input, liquidities);
    expect(result.value.toString()).toEqual("3.17929111705599");
  });

  test("should throw if all liquidities are zero", async () => {
    const input = {
      id: "",
      source: {
        "pangolin-usdc": createSafeNumber(3.23),
        uniswap: createSafeNumber(4.676),
        sushiswap: createSafeNumber(2.943),
        "trader-joe": createSafeNumber(4.6546),
      },
      symbol: "WAVAX",
      timestamp: createSafeNumber(0),
      version: "",
    } as unknown as SanitizedPriceDataBeforeAggregation;

    const liquidities = [
      {
        source: {
          "trader-joe": createSafeNumber(0),
        },
        symbol: "WAVAX_trader-joe_liquidity",
      },
      {
        source: {
          uniswap: createSafeNumber(0),
        },
        symbol: "WAVAX_uniswap_liquidity",
      },
      {
        source: {
          sushiswap: createSafeNumber(0),
        },
        symbol: "WAVAX_sushiswap_liquidity",
      },
      {
        source: {
          uniswap: createSafeNumber(0),
        },
        symbol: "WAVAX_pangolin-usdc_liquidity",
      },
    ] as unknown as PriceDataBeforeAggregation<number>[];

    expect(() =>
      lwapAggregator.getAggregatedValue(input, liquidities)
    ).toThrow();
  });
});
