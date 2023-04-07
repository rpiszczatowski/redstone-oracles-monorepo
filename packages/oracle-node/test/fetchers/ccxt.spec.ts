import {
  clearLocalDb,
  closeLocalDB,
  setupLocalDb,
} from "../../src/db/local-db";
import fetchers from "../../src/fetchers/index";
import { saveMockPricesInLocalDb } from "./_helpers";

jest.mock("ccxt", () => {
  const mockExchanges: any = {};
  const allSupportedExchanges = require("../../src/fetchers/ccxt/all-supported-exchanges.json");
  for (const exchange of allSupportedExchanges) {
    mockExchanges[exchange] = jest.fn().mockImplementation(() => {
      return {
        has: { fetchTickers: true },
        async fetchTickers() {
          return require("../../src/fetchers/ccxt/example-response.json");
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
    clearLocalDb();
  });

  afterAll(async () => {
    await closeLocalDB();
  });

  const sut = fetchers["binance"];

  it("should properly fetch data", async () => {
    await saveMockPricesInLocalDb([1, 1], ["USDT", "BUSD"]);

    const result = await sut.fetchAll(["BTC", "ETH"]);
    expect(result).toEqual([
      { symbol: "BTC", value: 32228.4 },
      { symbol: "ETH", value: 2008.25 },
    ]);
  });
});
