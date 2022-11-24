import {
  clearPricesSublevel,
  closeLocalLevelDB,
  savePrices,
} from "../src/db/local-db";
import PricesService, {
  PricesBeforeAggregation,
  PricesDataFetched,
} from "../src/fetchers/PricesService";
import emptyManifest from "../manifests/dev/empty.json";
import {
  PriceDataAfterAggregation,
  PriceDataBeforeAggregation,
} from "../src/types";

// Having hard time to mock uuid..so far only this solution is working: https://stackoverflow.com/a/61150430
jest.mock("uuid", () => ({ v4: () => "00000000-0000-0000-0000-000000000000" }));

const preparePrices = (
  partialPrices: Partial<PriceDataAfterAggregation>[]
): any[] => {
  const defaultPrice: PriceDataBeforeAggregation = {
    id: "00000000-0000-0000-0000-000000000000",
    symbol: "mock-symbol",
    source: {},
    timestamp: 555,
    version: "3",
  };
  return partialPrices.map((partialPrice) => ({
    ...defaultPrice,
    ...partialPrice,
  }));
};

describe("PricesService", () => {
  afterAll(async () => {
    await closeLocalLevelDB();
  });

  describe("groupPricesByToken", () => {
    const fetchTimestamp = 555;
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
        fetchTimestamp,
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
      const priceService = new PricesService(manifest, {});

      // Mocking `doFetchFromSource` function
      priceService.doFetchFromSource = async (
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
      const result: PricesDataFetched[] = await priceService.fetchInParallel({
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
      const priceService = new PricesService(
        {
          ...emptyManifest,
          tokens: {
            BTC: {
              skipSigning: true,
            },
            ETH: {},
          },
        },
        {}
      );

      const prices = preparePrices([
        {
          symbol: "ETH",
          value: 42,
        },
        {
          symbol: "BTC",
          value: 442,
        },
      ]);

      const filteredPrices = priceService.filterPricesForSigning(prices);

      expect(filteredPrices.map((p) => p.symbol)).toEqual(["ETH"]);
    });
  });

  describe("calculateAggregatedValues", () => {
    const priceService = new PricesService(emptyManifest, {});

    beforeEach(async () => {
      await clearPricesSublevel();
    });

    it("should properly calculate aggregated values for empty array", async () => {
      const pricesAfterAggregation =
        await priceService.calculateAggregatedValues([]);
      expect(pricesAfterAggregation.map((p) => p.value)).toEqual([]);
    });

    it("should properly calculate aggregated values (no deviations, no invalid)", async () => {
      const prices: PriceDataBeforeAggregation[] = preparePrices([
        { symbol: "ETH", source: { src1: 41, src2: 43, src3: 42 } },
        { symbol: "BTC", source: { src1: 442, src2: 443, src3: 442 } },
      ]);

      const pricesAfterAggregation =
        await priceService.calculateAggregatedValues(prices);

      expect(pricesAfterAggregation.map((p) => p.value)).toEqual([42, 442]);
    });

    it("should properly calculate aggregated values (some sources are invalid)", async () => {
      const prices: PriceDataBeforeAggregation[] = preparePrices([
        {
          symbol: "ETH",
          source: { src1: 0, src2: -10, src3: 42, src4: null, src5: "error" },
        },
      ]);

      const pricesAfterAggregation =
        await priceService.calculateAggregatedValues(prices);

      expect(pricesAfterAggregation.map((p) => p.value)).toEqual([42]);
    });

    it("should exclude price if there are no valid values for each source", async () => {
      const prices: PriceDataBeforeAggregation[] = preparePrices([
        {
          symbol: "ETH",
          source: { src1: 0, src2: -10, src3: -42, src4: null, src5: "error" },
        },
      ]);

      const pricesAfterAggregation =
        await priceService.calculateAggregatedValues(prices);

      expect(pricesAfterAggregation).toEqual([]);
    });

    it("should properly calculate aggregated values (some sources are too deviated)", async () => {
      await savePrices(preparePrices([{ symbol: "ETH", value: 41 }]));
      const prices: PriceDataBeforeAggregation[] = preparePrices([
        {
          symbol: "ETH",
          source: { src1: 40, src2: 20, src3: 44 }, // value from src2 should be exluded
        },
      ]);

      const pricesAfterAggregation =
        await priceService.calculateAggregatedValues(prices);

      expect(pricesAfterAggregation.map((p) => p.value)).toEqual([42]);
    });

    it("should exclude price if all sources values are deviated", async () => {
      await savePrices(preparePrices([{ symbol: "ETH", value: 42 }]));
      const prices: PriceDataBeforeAggregation[] = preparePrices([
        {
          symbol: "ETH",
          source: { src1: 60, src2: 20, src3: 100000 },
        },
      ]);

      const pricesAfterAggregation =
        await priceService.calculateAggregatedValues(prices);

      expect(pricesAfterAggregation).toEqual([]);
    });
  });

  describe("excludeInvalidSources", () => {
    // TODO: implement
    it("should exclude invalid sources", () => {});

    // TODO: implement
    it("should exclude deviated sources", () => {});
  });

  describe("assertValidPrice", () => {
    // TODO: implement
    it("should pass assertion for valid price", () => {});

    // TODO: implement
    it("should throw for 0 value", () => {});

    // TODO: implement
    it("should throw for negative value", () => {});

    // TODO: implement
    it("should throw for NaN value", () => {});

    // TODO: implement
    it("should throw for deviated value", () => {});
  });

  describe("getDeviationPercentWithRecentValues", () => {
    // TODO: implement
    it("should properly calculate deviation with recent values", () => {});

    // TODO: implement
    it("should exclude too old values from the deviation calculation", () => {});

    // TODO: implement
    it("should return 0% deviation if there are no recent values", () => {});
  });
});
