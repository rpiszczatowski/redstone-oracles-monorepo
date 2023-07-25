import { SafeNumber } from "redstone-utils";
import {
  clearPricesSublevel,
  closeLocalLevelDB,
  getPrices,
  setupLocalDb,
  PriceValuesInLocalDB,
  savePrices,
  getLastPrice,
} from "../../src/db/local-db";
import { PriceDataAfterAggregation } from "../../src/types";
import { roundTimestamp } from "../../src/utils/timestamps";

const PRICES_TTL_MILLISECONDS = 15 * 60 * 1000; // 15 minutes
const FIVE_MINUTES_IN_MILLISECONDS = 1000 * 60 * 5;

const source = {};
const id = "mock-id";
const timestamp = Date.now();
const version = "mock-version";
const defaultPriceProps: Omit<PriceDataAfterAggregation, "value" | "symbol"> = {
  source,
  timestamp,
  id,
  version,
  sourceMetadata: {},
};
const prices: PriceDataAfterAggregation[] = [
  {
    ...defaultPriceProps,
    symbol: "BTC",
    value: SafeNumber.createSafeNumber(4242),
  },
  {
    ...defaultPriceProps,
    symbol: "ETH",
    value: SafeNumber.createSafeNumber(42),
  },
];

jest.setTimeout(120000); // This file has a long-running test

const mockCurrentTimestamp = (newCurrentTimestamp: number) => {
  jest.useFakeTimers().setSystemTime(new Date(newCurrentTimestamp));
};

describe("Local DB", () => {
  beforeAll(() => {
    setupLocalDb();
  });

  beforeEach(async () => {
    await clearPricesSublevel();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  it("should properly put and get data", async () => {
    expect(await getPrices(["BTC", "ETH"])).toEqual({
      BTC: [],
      ETH: [],
    });

    await savePrices(prices);

    expect(await getPrices(["BTC", "ETH"])).toEqual({
      BTC: [{ value: "4242", timestamp }],
      ETH: [{ value: "42", timestamp }],
    });

    await savePrices(prices);

    expect(await getPrices(["BTC", "ETH"])).toEqual({
      BTC: [
        { value: "4242", timestamp },
        { value: "4242", timestamp },
      ],
      ETH: [
        { value: "42", timestamp },
        { value: "42", timestamp },
      ],
    });
  });

  it("should remove old prices", async () => {
    await savePrices(prices);
    await savePrices(prices);

    expect(await getPrices(["BTC", "ETH"])).toEqual({
      BTC: [
        { value: "4242", timestamp },
        { value: "4242", timestamp },
      ],
      ETH: [
        { value: "42", timestamp },
        { value: "42", timestamp },
      ],
    });

    const newCurrentTimestamp = Date.now() + PRICES_TTL_MILLISECONDS + 1;
    mockCurrentTimestamp(newCurrentTimestamp);

    const newerPrices = prices.map((p) => ({
      ...p,
      timestamp: newCurrentTimestamp,
    }));
    await savePrices(newerPrices);

    expect(await getPrices(["BTC", "ETH"])).toEqual({
      BTC: [{ value: "4242", timestamp: newCurrentTimestamp }],
      ETH: [{ value: "42", timestamp: newCurrentTimestamp }],
    });
  });

  it("should correctly simulate adding and clearing data of 2K assets for 20 minutes", async () => {
    const testAssetsCount = 2000;
    const testingRangeLengthMilliseconds = 20 * 60 * 1000; // 20 minutes
    const startTimestamp = Date.now();
    const endTimestamp = startTimestamp + testingRangeLengthMilliseconds;
    const interval = 10000; // 10 seconds

    const getTestSymbol = (assetIndex: string) => `SYMBOL-${assetIndex}`;

    const preparePrices = (timestamp: number): PriceDataAfterAggregation[] => {
      const roundedTimestamp = roundTimestamp(timestamp);
      const prices: PriceDataAfterAggregation[] = [];
      for (let assetIndex = 0; assetIndex < testAssetsCount; assetIndex++) {
        const symbol = getTestSymbol(assetIndex.toString());
        prices.push({
          ...defaultPriceProps,
          symbol,
          value: SafeNumber.createSafeNumber(assetIndex),
          timestamp: roundedTimestamp,
        });
      }
      return prices;
    };

    // This function verifies if there are all required prices
    // But there are no "old" prices
    const testPricesFromDB = (
      pricesFromDB: PriceValuesInLocalDB,
      timestamp: number,
      expectedPricesCountPerAsset: number
    ) => {
      // We check values only for few assets to speed up tests
      for (const assetIndex of ["0", "42", "1500"]) {
        const symbol = getTestSymbol(assetIndex);
        expect(pricesFromDB).toHaveProperty(symbol);
        expect(pricesFromDB[symbol].length).toBe(expectedPricesCountPerAsset);
        for (const priceFromDB of pricesFromDB[symbol]) {
          expect(priceFromDB.timestamp).toBeGreaterThanOrEqual(
            timestamp - PRICES_TTL_MILLISECONDS
          );
          expect(priceFromDB.value).toBe(assetIndex);
        }
      }
    };

    // Running the simulation with tests
    let iterationIndex = 0;
    for (
      let timestamp = startTimestamp;
      timestamp <= endTimestamp;
      timestamp += interval
    ) {
      mockCurrentTimestamp(timestamp);
      console.log(
        `Testing price clearing in local db. ` +
          `Iteration index: ${iterationIndex}/120. Mock timestamp: ${timestamp}`
      );
      const prices = preparePrices(timestamp);
      await savePrices(prices);
      const pricesFromDB = await getPrices(prices.map((p) => p.symbol));
      const expectedPricesCountPerAsset = Math.min(
        iterationIndex + 1,
        Math.floor(PRICES_TTL_MILLISECONDS / interval)
      );
      testPricesFromDB(pricesFromDB, timestamp, expectedPricesCountPerAsset);
      iterationIndex++;
    }
  });

  it("shouldn't return last price if time diff too big", async () => {
    await savePrices([
      ...prices,
      {
        ...defaultPriceProps,
        timestamp: defaultPriceProps.timestamp - FIVE_MINUTES_IN_MILLISECONDS,
        symbol: "AVAX",
        value: SafeNumber.createSafeNumber("17"),
      },
    ]);

    expect(() => getLastPrice("AVAX")).toThrowError(
      "Last price in local DB for AVAX is obsolete, time diff"
    );
  });
});
