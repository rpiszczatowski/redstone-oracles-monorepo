import { SafeNumber } from "@redstone-finance/utils";
import emptyManifest from "../manifests/dev/empty.json";
import {
  PriceValueInLocalDB,
  clearPricesSublevel,
  closeLocalLevelDB,
  savePrices,
  setupLocalDb,
} from "../src/db/local-db";
import PricesService, {
  PriceValidationArgs,
  PricesDataFetched,
} from "../src/fetchers/PricesService";
import {
  NotSanitizedPriceDataBeforeAggregation,
  PriceDataAfterAggregation,
  PriceDataFetchedValue,
} from "../src/types";
import {
  preparePrice,
  preparePrices,
  prepareSanitizeAndAggregatePrices,
} from "./fetchers/_helpers";
import { config } from "../src/config";

jest.mock("../src/Terminator", () => ({
  terminateWithManifestConfigError: (details: string) => {
    throw new Error(`Mock manifest config termination: ${details}`);
  },
}));

// Having hard time to mock uuid..so far only this solution is working: https://stackoverflow.com/a/61150430
jest.mock("uuid", () => ({ v4: () => "00000000-0000-0000-0000-000000000000" }));
const testTimestamp = Date.now();

const pricesService = new PricesService({
  ...emptyManifest,
  defaultSource: ["src1"],
});

describe("PricesService", () => {
  beforeAll(() => {
    setupLocalDb();
  });

  beforeEach(async () => {
    await clearPricesSublevel();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  describe("groupPricesByToken", () => {
    const fetchTimestamp = 0;
    const nodeVersion = "3";

    it("should assign values from different sources to tokens/symbols", () => {
      // Given
      const defaultPriceFields = {
        id: "00000000-0000-0000-0000-000000000000",
        timestamp: fetchTimestamp,
        version: nodeVersion,
      };
      const pricesData: PricesDataFetched = {
        src1: [
          { symbol: "BTC", value: 444 },
          { symbol: "ETH", value: 222 },
          { symbol: "DOGE", value: 111 },
        ],
        src2: [
          { symbol: "BTC", value: 444.2 },
          { symbol: "ETH", value: 222.5 },
        ],
        src3: [
          { symbol: "DOGE", value: 107.4 },
          { symbol: "ETH", value: "error" },
        ],
      };

      // When
      const result = PricesService.groupPricesByToken(
        { timestamp: fetchTimestamp },
        pricesData,
        nodeVersion
      );

      // Then
      expect(result).toEqual({
        BTC: {
          ...defaultPriceFields,
          source: {
            src1: 444,
            src2: 444.2,
          },
          sourceMetadata: {
            src1: { value: "444" },
            src2: { value: "444.2" },
          },
          symbol: "BTC",
        },
        DOGE: {
          ...defaultPriceFields,
          source: {
            src1: 111,
            src3: 107.4,
          },
          sourceMetadata: {
            src1: { value: "111" },
            src3: { value: "107.4" },
          },
          symbol: "DOGE",
        },
        ETH: {
          ...defaultPriceFields,
          source: {
            src1: 222,
            src2: 222.5,
            src3: "error",
          },
          sourceMetadata: {
            src1: { value: "222" },
            src2: { value: "222.5" },
            src3: { value: "error" },
          },
          symbol: "ETH",
        },
      });
    });
  });

  describe("fetchInParrallel", () => {
    it("Should correctly fetch from sources", async () => {
      // Given
      const manifest = {
        ...emptyManifest,
        defaultSource: ["mock"],
      };
      const pricesService = new PricesService(manifest);

      // Mocking `doFetchFromSource` function
      pricesService.doFetchFromSource = async (
        source: string,
        tokens: string[]
      ) => {
        if (source.includes("bad")) {
          throw new Error("test-error");
        } else {
          return await Promise.resolve(
            tokens.map((symbol) => ({ symbol, value: 1 }))
          );
        }
      };

      // When
      const result: PricesDataFetched[] = await pricesService.fetchInParallel({
        "good-src-1": ["BTC", "ETH"],
        "good-src-2": ["BTC", "DAI"],
        "bad-src": ["DAI", "USDT"],
      });

      // Then
      expect(result).toEqual([
        {
          "good-src-1": [
            {
              symbol: "BTC",
              value: 1,
            },
            {
              symbol: "ETH",
              value: 1,
            },
          ],
        },
        {
          "good-src-2": [
            {
              symbol: "BTC",
              value: 1,
            },
            {
              symbol: "DAI",
              value: 1,
            },
          ],
        },
        {
          "bad-src": [
            {
              symbol: "DAI",
              value: "error",
            },
            {
              symbol: "USDT",
              value: "error",
            },
          ],
        },
      ]);
    });
  });

  describe("filterPricesForSigning", () => {
    it("should properly filter prices for signing", () => {
      const pricesService = new PricesService({
        ...emptyManifest,
        tokens: {
          BTC: {
            skipSigning: true,
          },
          ETH: {},
        },
      });

      const prices = prepareSanitizeAndAggregatePrices([
        {
          symbol: "ETH",
          value: 42,
        },
        {
          symbol: "BTC",
          value: 442,
        },
      ]);

      const filteredPrices = pricesService.filterPricesForSigning(prices);

      expect(filteredPrices.map((p) => p.symbol)).toEqual(["ETH"]);
    });
  });

  describe("calculateAggregatedValues", () => {
    it("should properly calculate aggregated values for empty array", async () => {
      const pricesAfterAggregation =
        await pricesService.calculateAggregatedValues([]);
      expect(pricesAfterAggregation.map((p) => p.value)).toEqual([]);
    });

    it("should properly calculate aggregated values (no deviations, no invalid)", async () => {
      const notSanitizedPrices = preparePrices([
        {
          symbol: "ETH",
          source: {
            src1: 41,
            src2: 43,
            src3: 42,
          },
        },
        {
          symbol: "BTC",
          source: {
            src1: 442,
            src2: 443,
            src3: 442,
          },
        },
      ]);

      const pricesAfterAggregation =
        await pricesService.calculateAggregatedValues(notSanitizedPrices);

      expect(pricesAfterAggregation.map((p) => p.value.toString())).toEqual([
        "42",
        "442",
      ]);
    });

    it("should properly calculate aggregated values (some sources are too deviated)", async () => {
      await savePrices(
        prepareSanitizeAndAggregatePrices([{ symbol: "ETH", value: 41 }])
      );
      const notSanitizedPrices = preparePrices([
        {
          symbol: "ETH",
          source: {
            src1: 40,
            src2: 20,
            src3: 44,
          }, // value from src2 should be exluded
        },
      ]);

      const pricesAfterAggregation =
        await pricesService.calculateAggregatedValues(notSanitizedPrices);

      expect(pricesAfterAggregation.map((p) => p.value.toString())).toEqual([
        "42",
      ]);
    });

    it("should exclude price if all sources values are deviated", async () => {
      await savePrices(
        prepareSanitizeAndAggregatePrices([{ symbol: "ETH", value: 42 }])
      );
      const notSanitizedPrices = preparePrices([
        {
          symbol: "ETH",
          source: {
            src1: 60,
            src2: 20,
            src3: 100000,
          },
        },
      ]);

      const pricesAfterAggregation =
        await pricesService.calculateAggregatedValues(notSanitizedPrices);

      expect(pricesAfterAggregation).toEqual([]);
    });
  });

  describe("sanitizeSourceValues", () => {
    const checkSourceValuesSanitization = (
      price: NotSanitizedPriceDataBeforeAggregation,
      recentPrices: PriceValueInLocalDB[],
      expectedValuesBySource: Record<string, string>
    ) => {
      const priceWithExcludedSources = PricesService.sanitizeSourceValues(
        price,
        recentPrices,
        emptyManifest.deviationCheck
      );
      const comparableSources: Record<string, string> = {};
      Object.entries(priceWithExcludedSources.source).forEach(
        ([key, value]) => {
          comparableSources[key] = value.toString();
        }
      );
      expect(comparableSources).toEqual(expectedValuesBySource);
    };

    it("should exclude invalid sources", () => {
      const price = preparePrice({
        source: {
          src1: [] as unknown as PriceDataFetchedValue,
          src2: -10,
          src3: 42,
          src4: null,
          src5: "error",
          src6: {} as unknown as PriceDataFetchedValue,
          src7: 123,
        },
      });
      checkSourceValuesSanitization(price, [], { src3: "42", src7: "123" });
    });

    it("should exclude deviated sources", () => {
      const notSanitizedPrices = preparePrice({
        symbol: "ETH",
        source: {
          src1: 100,
          src2: 44,
          src3: 20,
          src4: 41,
          src5: 42,
        },
      });
      const recentPrices = [
        { value: "42", timestamp: notSanitizedPrices.timestamp },
      ];
      checkSourceValuesSanitization(notSanitizedPrices, recentPrices, {
        src2: "44",
        src4: "41",
        src5: "42",
      });
    });

    it("should exclude sources with too high slippage", () => {
      const simulationValueInUsd = config.simulationValueInUsdForSlippageCheck;
      const notSanitizedPrices = preparePrice({
        symbol: "ETH",
        source: {
          src1: 100,
          src2: 101,
          src3: 102,
          src4: 103,
          src5: 105,
        },
        sourceMetadata: {
          // src1 should be excluded due to lack of "buy direction"
          src1: {
            slippage: [
              {
                direction: "sell",
                simulationValueInUsd,
                slippageAsPercent: "3", // valid, cause less than 10
              },
            ],
          },

          // src2 should stay, it's valid
          src2: {
            slippage: [
              {
                direction: "buy",
                simulationValueInUsd,
                slippageAsPercent: "9.9", // valid, cause less than 10
              },
              {
                direction: "sell",
                simulationValueInUsd,
                slippageAsPercent: "3", // valid, cause less than 10
              },
            ],
          },

          // src3 should be excluded, due to too high slippage
          src3: {
            slippage: [
              {
                direction: "buy",
                simulationValueInUsd,
                slippageAsPercent: "1", // valid, cause less than 10
              },
              {
                direction: "sell",
                simulationValueInUsd,
                slippageAsPercent: "10.001", // too big slippage, >10
              },
            ],
          },

          // src4 is not presented here, e.g. if it doesn't support slippage,
          // so it also should be considered valid

          // src5 should be exluded due to presented slippage data, but missing
          // required simualtion amount
          src5: {
            slippage: [
              {
                direction: "buy",
                simulationValueInUsd: "100",
                slippageAsPercent: "1",
              },
              {
                direction: "sell",
                simulationValueInUsd: "100",
                slippageAsPercent: "2",
              },
            ],
          },
        },
      });
      checkSourceValuesSanitization(notSanitizedPrices, [], {
        src2: "101",
        src4: "103",
      });
    });
  });

  describe("getDeviationWithRecentValuesAverage", () => {
    const getDeviation = (
      partialPriceValidationArgs: Partial<PriceValidationArgs>
    ) => {
      const defaultPriceValidationArgs = {
        value: SafeNumber.createSafeNumber(42),
        timestamp: testTimestamp,
        deviationConfig: emptyManifest.deviationCheck,
        recentPrices: [],
      };
      return PricesService.getDeviationWithRecentValuesAverage({
        ...defaultPriceValidationArgs,
        ...partialPriceValidationArgs,
      }).unsafeToNumber();
    };

    it("should properly calculate deviation with recent values", () => {
      expect(
        getDeviation({
          value: SafeNumber.createSafeNumber(42),
          recentPrices: [{ value: "42", timestamp: testTimestamp - 1 }],
        })
      ).toBe(0);

      expect(
        getDeviation({
          value: SafeNumber.createSafeNumber(84),
          recentPrices: [{ value: "42", timestamp: testTimestamp - 1 }],
        })
      ).toBe(100);

      expect(
        getDeviation({
          value: SafeNumber.createSafeNumber(63),
          recentPrices: [{ value: "42", timestamp: testTimestamp - 1 }],
        })
      ).toBe(50);

      expect(
        getDeviation({
          value: SafeNumber.createSafeNumber(168),
          recentPrices: [{ value: "42", timestamp: testTimestamp - 1 }],
        })
      ).toBe(300);

      expect(
        getDeviation({
          value: SafeNumber.createSafeNumber(11),
          recentPrices: [{ value: "10", timestamp: testTimestamp - 1 }],
        })
      ).toBe(10);

      expect(
        getDeviation({
          value: SafeNumber.createSafeNumber(11),
          recentPrices: [
            { value: "9.5", timestamp: testTimestamp - 1 },
            { value: "10.5", timestamp: testTimestamp - 2 },
          ],
        })
      ).toBe(10);

      expect(
        getDeviation({
          value: SafeNumber.createSafeNumber(21),
          recentPrices: [{ value: "42", timestamp: testTimestamp - 1 }],
        })
      ).toBe(50);
    });

    it("should properly calculate deviations for big recent prices arrays", () => {
      expect(
        getDeviation({
          value: SafeNumber.createSafeNumber(210000),
          recentPrices: Array(30000).fill({
            value: "420000",
            timestamp: testTimestamp - 1,
          }),
        })
      ).toBe(50);
    });

    it("should exclude too old values from the deviation calculation", () => {
      expect(
        getDeviation({
          value: SafeNumber.createSafeNumber(21),
          recentPrices: [
            { value: "42", timestamp: testTimestamp - 2 * 60 * 1000 },
            { value: "41", timestamp: testTimestamp - 3 * 60 * 1000 },
            { value: "43", timestamp: testTimestamp - 4 * 60 * 1000 },
            { value: "1", timestamp: testTimestamp - 180 * 60 * 1000 },
          ],
        })
      ).toBe(50);
    });

    it("should return 0% deviation if there are no recent values", () => {
      expect(
        getDeviation({
          value: SafeNumber.createSafeNumber(42),
          recentPrices: [],
        })
      ).toBe(0);
    });
  });

  describe("assertSourcesNumber", () => {
    const manifest = {
      ...emptyManifest,
      tokens: {
        TestToken: {
          source: ["testSource1", "testSource2", "testSource3", "testSource4"],
        },
      },
      minValidSourcesPercentage: 50,
    };

    const priceObject = {
      value: 43,
      symbol: "TestToken",
      source: {
        testSource1: SafeNumber.createSafeNumber(42),
        testSource2: SafeNumber.createSafeNumber(44),
        testSource4: SafeNumber.createSafeNumber(43),
      },
    } as unknown as PriceDataAfterAggregation;

    test("should pass assertion for enough sources", () => {
      PricesService.assertSourcesNumber(priceObject, manifest);
    });

    test("should pass assertion for exactly minValidSourcesPercentage", () => {
      const newPriceObject = {
        ...priceObject,
        source: {
          testSource1: SafeNumber.createSafeNumber(42),
          testSource3: SafeNumber.createSafeNumber(44),
        },
      };
      PricesService.assertSourcesNumber(newPriceObject, manifest);
    });

    test("should not pass assertion for less than minValidSourcesPercentage", () => {
      const newPriceObject = {
        ...priceObject,
        source: { testSource3: SafeNumber.createSafeNumber(43) },
      };
      expect(() =>
        PricesService.assertSourcesNumber(newPriceObject, manifest)
      ).toThrowError(
        "Invalid sources number for symbol TestToken. Valid sources count: 1. Valid sources: testSource3"
      );
    });

    test("should not pass assertion for zero sources", () => {
      const newPriceObject = {
        ...priceObject,
        source: {},
      };
      expect(() =>
        PricesService.assertSourcesNumber(newPriceObject, manifest)
      ).toThrowError(
        "Invalid sources number for symbol TestToken. Valid sources count: 0. Valid sources: "
      );
    });
  });

  describe("doFetchFromSource", () => {
    test("should shutdown if fetcher for given source doesn't exist", async () => {
      const pricesService = new PricesService({
        ...emptyManifest,
        defaultSource: ["non-existing"],
      });

      await expect(
        pricesService.doFetchFromSource("non-existing", ["BTC"])
      ).rejects.toThrowError(/Mock manifest config termination/);
    });
  });
});
