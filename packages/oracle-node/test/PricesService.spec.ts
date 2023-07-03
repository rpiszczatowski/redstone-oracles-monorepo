import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
  savePrices,
} from "../src/db/local-db";
import PricesService, {
  PricesBeforeAggregation,
  PricesDataFetched,
  PriceValidationArgs,
} from "../src/fetchers/PricesService";
import emptyManifest from "../manifests/dev/empty.json";
import {
  PriceDataAfterAggregation,
  PriceDataBeforeAggregation,
} from "../src/types";
import { preparePrices, preparePrice } from "./fetchers/_helpers";
import { SafeNumber } from "redstone-utils";

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
      const result: PricesBeforeAggregation = PricesService.groupPricesByToken(
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
          symbol: "BTC",
        },
        DOGE: {
          ...defaultPriceFields,
          source: {
            src1: 111,
            src3: 107.4,
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
          return tokens.map((symbol) => ({ symbol, value: 1 }));
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

      const prices = preparePrices([
        {
          symbol: "ETH",
          value: SafeNumber.createSafeNumber(42),
        },
        {
          symbol: "BTC",
          value: SafeNumber.createSafeNumber(442),
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
      const prices: PriceDataBeforeAggregation[] = preparePrices([
        {
          symbol: "ETH",
          source: {
            src1: SafeNumber.createSafeNumber(41),
            src2: SafeNumber.createSafeNumber(43),
            src3: SafeNumber.createSafeNumber(42),
          },
        },
        {
          symbol: "BTC",
          source: {
            src1: SafeNumber.createSafeNumber(442),
            src2: SafeNumber.createSafeNumber(443),
            src3: SafeNumber.createSafeNumber(442),
          },
        },
      ]);

      const pricesAfterAggregation =
        await pricesService.calculateAggregatedValues(prices);

      expect(pricesAfterAggregation.map((p) => p.value.toString())).toEqual([
        "42",
        "442",
      ]);
    });

    it("should properly calculate aggregated values (some sources are too deviated)", async () => {
      await savePrices(
        preparePrices([
          { symbol: "ETH", value: SafeNumber.createSafeNumber(41) },
        ])
      );
      const prices: PriceDataBeforeAggregation[] = preparePrices([
        {
          symbol: "ETH",
          source: {
            src1: SafeNumber.createSafeNumber(40),
            src2: SafeNumber.createSafeNumber(20),
            src3: SafeNumber.createSafeNumber(44),
          }, // value from src2 should be exluded
        },
      ]);

      const pricesAfterAggregation =
        await pricesService.calculateAggregatedValues(prices);

      expect(pricesAfterAggregation.map((p) => p.value.toString())).toEqual([
        "42",
      ]);
    });

    it("should exclude price if all sources values are deviated", async () => {
      await savePrices(
        preparePrices([
          { symbol: "ETH", value: SafeNumber.createSafeNumber(42) },
        ])
      );
      const prices: PriceDataBeforeAggregation[] = preparePrices([
        {
          symbol: "ETH",
          source: {
            src1: SafeNumber.createSafeNumber(60),
            src2: SafeNumber.createSafeNumber(20),
            src3: SafeNumber.createSafeNumber(100000),
          },
        },
      ]);

      const pricesAfterAggregation =
        await pricesService.calculateAggregatedValues(prices);

      expect(pricesAfterAggregation).toEqual([]);
    });
  });

  describe("sanitizeSourceValues", () => {
    it("should exclude invalid sources", () => {
      const price = preparePrice({
        source: {
          src1: [],
          src2: -10,
          src3: 42,
          src4: null,
          src5: "error",
          src6: {},
          src7: 123,
        } as any,
      });
      const priceWithExcludedSources = pricesService.sanitizeSourceValues(
        price,
        [],
        emptyManifest.deviationCheck
      );
      const comparableSources: Record<string, string> = {};
      Object.entries(priceWithExcludedSources.source).forEach(
        ([key, value]) => {
          comparableSources[key] = value.toString() as any;
        }
      );
      expect(comparableSources).toEqual({ src3: "42", src7: "123" });
    });

    it("should exclude deviated sources", async () => {
      const price = preparePrice({
        symbol: "ETH",
        source: {
          src1: SafeNumber.createSafeNumber(100),
          src2: SafeNumber.createSafeNumber(44),
          src3: SafeNumber.createSafeNumber(20),
          src4: SafeNumber.createSafeNumber(41),
          src5: SafeNumber.createSafeNumber(42),
        },
      });
      const recentPrices = [{ value: "42", timestamp: price.timestamp }];
      const priceWithExcludedSources = pricesService.sanitizeSourceValues(
        price,
        recentPrices,
        emptyManifest.deviationCheck
      );
      const comparableSources: Record<string, string> = {};
      Object.entries(priceWithExcludedSources.source).forEach(
        ([key, value]) => {
          comparableSources[key] = value.toString() as any;
        }
      );
      expect(comparableSources).toEqual({
        src2: "44",
        src4: "41",
        src5: "42",
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
      return pricesService
        .getDeviationWithRecentValuesAverage({
          ...defaultPriceValidationArgs,
          ...partialPriceValidationArgs,
        })
        .unsafeToNumber();
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
      pricesService.assertSourcesNumber(priceObject, manifest);
    });

    test("should pass assertion for exactly minValidSourcesPercentage", () => {
      const newPriceObject = {
        ...priceObject,
        source: {
          testSource1: SafeNumber.createSafeNumber(42),
          testSource3: SafeNumber.createSafeNumber(44),
        },
      };
      pricesService.assertSourcesNumber(newPriceObject, manifest);
    });

    test("should not pass assertion for less than minValidSourcesPercentage", () => {
      const newPriceObject = {
        ...priceObject,
        source: { testSource3: SafeNumber.createSafeNumber(43) },
      };
      expect(() =>
        pricesService.assertSourcesNumber(newPriceObject, manifest)
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
        pricesService.assertSourcesNumber(newPriceObject, manifest)
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
