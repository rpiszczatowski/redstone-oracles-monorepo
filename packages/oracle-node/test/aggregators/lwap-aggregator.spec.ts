import lwapAggregator from "../../src/aggregators/lwap-aggregator/lwap-aggregator";
import { closeLocalLevelDB, setupLocalDb } from "../../src/db/local-db";
import { N } from "../../src/numbers/RedstoneNumberFactory";
import {
  PriceDataBeforeAggregation,
  SanitizedPriceDataBeforeAggregation,
} from "../../src/types";

describe.only("lwapAggregator", () => {
  beforeAll(() => {
    setupLocalDb();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("should throw error if liquidities missing", async () => {
    const input = {
      source: {
        "trader-joe": N(3),
        uniswap: N(7),
        sushiswap: N(2),
      },
      symbol: "WAVAX",
    } as unknown as SanitizedPriceDataBeforeAggregation;
    const liquidities = [
      {
        source: {
          "trader-joe": N(43542.3241241),
        },
        symbol: "WAVAX_trader-joe_liquidity",
      },
      {
        source: {
          uniswap: N(43542.3241241),
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
        "pangolin-wavax": N(3),
        "trader-joe": N(7),
        sushiswap: N(6),
      },
      symbol: "WAVAX",
    } as unknown as SanitizedPriceDataBeforeAggregation;

    const liquidities = [
      {
        source: {
          "trader-joe": N(43542.3241241),
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
          uniswap: N(234563.5467),
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
        "pangolin-usdc": N(3.23),
        uniswap: N(4.676),
        sushiswap: N(2.943),
        "trader-joe": N(4.6546),
      },
      symbol: "WAVAX",
      timestamp: 0,
      version: "",
    } as unknown as SanitizedPriceDataBeforeAggregation;

    const liquidities = [
      {
        source: {
          "trader-joe": N(32343.431989),
        },
        symbol: "WAVAX_trader-joe_liquidity",
      },
      {
        source: {
          uniswap: N(123450.534543),
        },
        symbol: "WAVAX_uniswap_liquidity",
      },
      {
        source: {
          sushiswap: N(993241.090542),
        },
        symbol: "WAVAX_sushiswap_liquidity",
      },
      {
        source: {
          uniswap: N(43542.3241241),
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
        "pangolin-usdc": N(3.23),
        uniswap: N(4.676),
        sushiswap: N(2.943),
        "trader-joe": N(4.6546),
      },
      symbol: "WAVAX",
      timestamp: N(0),
      version: "",
    } as unknown as SanitizedPriceDataBeforeAggregation;

    const liquidities = [
      {
        source: {
          "trader-joe": N(0),
        },
        symbol: "WAVAX_trader-joe_liquidity",
      },
      {
        source: {
          uniswap: N(0),
        },
        symbol: "WAVAX_uniswap_liquidity",
      },
      {
        source: {
          sushiswap: N(0),
        },
        symbol: "WAVAX_sushiswap_liquidity",
      },
      {
        source: {
          uniswap: N(0),
        },
        symbol: "WAVAX_pangolin-usdc_liquidity",
      },
    ] as unknown as PriceDataBeforeAggregation<number>[];

    expect(() =>
      lwapAggregator.getAggregatedValue(input, liquidities)
    ).toThrow();
  });
});
