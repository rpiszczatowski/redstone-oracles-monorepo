import { closeLocalLevelDB } from "../src/db/local-db";
import PricesService, {
  PricesBeforeAggregation,
  PricesDataFetched,
} from "../src/fetchers/PricesService";
import emptyManifest from "../manifests/dev/empty.json";

// Having hard time to mock uuid..so far only this solution is working: https://stackoverflow.com/a/61150430
jest.mock("uuid", () => ({ v4: () => "00000000-0000-0000-0000-000000000000" }));

describe("groupPricesByToken", () => {
  const fetchTimestamp = 555;
  const nodeVersion = "3";

  afterAll(async () => {
    await closeLocalLevelDB();
  });

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
  afterAll(async () => {
    await closeLocalLevelDB();
  });

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
  afterAll(async () => {
    await closeLocalLevelDB();
  });

  it("should properly filter prices for signing", () => {});
});

describe("calculateAggregatedValues", () => {
  afterAll(async () => {
    await closeLocalLevelDB();
  });

  // TODO: implement
  it("should properly calculate aggregated values (no deviations, no invalid)", () => {});

  // TODO: implement
  it("should properly calculate aggregated values (some sources are invalid)", () => {});

  // TODO: implement
  it("should properly calculate aggregated values (some sources are too deviated)", () => {});

  // TODO: implement
  it("should throw if there are no valid values for each source", () => {});

  // TODO: implement
  it("should throw if all sources values are deviated", () => {});
});

describe("excludeInvalidSources", () => {
  afterAll(async () => {
    await closeLocalLevelDB();
  });

  // TODO: implement
  it("should exclude invalid sources", () => {});

  // TODO: implement
  it("should exclude deviated sources", () => {});
});

describe("assertValidPrice", () => {
  afterAll(async () => {
    await closeLocalLevelDB();
  });

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
  afterAll(async () => {
    await closeLocalLevelDB();
  });

  // TODO: implement
  it("should calculate deviation with recent values", () => {});

  // TODO: implement
  it("should exclude too old values from the deviation calculation", () => {});

  // TODO: implement
  it("should return 0% deviation if there are no recent values", () => {});
});
