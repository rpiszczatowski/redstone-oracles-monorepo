import {
  clearPricesSublevel,
  getPrices,
  savePrices,
} from "../../src/db/local-db";
import { PriceDataAfterAggregation } from "../../src/types";

const PRICES_TTL_MILLISECONDS = 15 * 60 * 1000; // 15 minutes

const source = {};
const id = "mock-id";
const timestamp = Date.now();
const version = "mock-version";
const defaultPriceProps = {
  source,
  timestamp,
  id,
  version,
};
const prices: PriceDataAfterAggregation[] = [
  {
    ...defaultPriceProps,
    symbol: "BTC",
    value: 4242,
  },
  {
    ...defaultPriceProps,
    symbol: "ETH",
    value: 42,
  },
];

describe("Local DB", () => {
  beforeEach(async () => {
    await clearPricesSublevel();
  });

  it("should properly put and get data", async () => {
    expect(await getPrices(["BTC", "ETH"])).toEqual({
      BTC: [],
      ETH: [],
    });

    await savePrices(prices);

    expect(await getPrices(["BTC", "ETH"])).toEqual({
      BTC: [{ value: 4242, timestamp }],
      ETH: [{ value: 42, timestamp }],
    });

    await savePrices(prices);

    expect(await getPrices(["BTC", "ETH"])).toEqual({
      BTC: [
        { value: 4242, timestamp },
        { value: 4242, timestamp },
      ],
      ETH: [
        { value: 42, timestamp },
        { value: 42, timestamp },
      ],
    });
  });

  it("should remove old prices", async () => {
    await savePrices(prices);
    await savePrices(prices);

    expect(await getPrices(["BTC", "ETH"])).toEqual({
      BTC: [
        { value: 4242, timestamp },
        { value: 4242, timestamp },
      ],
      ETH: [
        { value: 42, timestamp },
        { value: 42, timestamp },
      ],
    });

    const newCurrentTimestamp = Date.now() + PRICES_TTL_MILLISECONDS + 1;
    jest.useFakeTimers().setSystemTime(new Date(newCurrentTimestamp));

    const newerPrices = prices.map((p) => ({
      ...p,
      timestamp: newCurrentTimestamp,
    }));
    await savePrices(newerPrices);

    expect(await getPrices(["BTC", "ETH"])).toEqual({
      BTC: [{ value: 4242, timestamp: newCurrentTimestamp }],
      ETH: [{ value: 42, timestamp: newCurrentTimestamp }],
    });
  });
});
