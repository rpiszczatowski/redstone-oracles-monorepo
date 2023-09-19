import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import fetchers from "../../src/fetchers/index";
import { saveMockPricesInLocalDb } from "./_helpers";

jest.mock("ccxt", () => {
  const mockExchanges: Record<string, unknown> = {};
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  for (const exchange of require("../../src/fetchers/ccxt/all-supported-exchanges.json") as string[]) {
    mockExchanges[exchange] = jest.fn().mockImplementation(() => {
      return {
        has: { fetchTickers: true },
        // eslint-disable-next-line @typescript-eslint/require-await
        async fetchTickers() {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          return require("../../src/fetchers/ccxt/example-response.json") as unknown;
        },
      };
    });
  }

  return {
    __esModule: true,
    default: mockExchanges,
  };
});

describe("ccxt fetcher", () => {
  beforeAll(() => {
    setupLocalDb();
  });

  beforeEach(async () => {
    await clearPricesSublevel();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  const sut = fetchers["binance"]!;

  it("should properly fetch data", async () => {
    await saveMockPricesInLocalDb([1, 1], ["USDT", "BUSD"]);

    const result = await sut.fetchAll(["BTC", "ETH"]);
    expect(result).toEqual([
      { symbol: "BTC", value: 32228.4 },
      { symbol: "ETH", value: 2008.25 },
    ]);
  });
});
