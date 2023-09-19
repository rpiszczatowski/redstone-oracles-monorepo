import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import fetchers from "../../src/fetchers/index";
import { saveMockPricesInLocalDb } from "./_helpers";

describe("Non USD based fetcher", () => {
  const fetcher = fetchers["non-usd-based"]!;

  beforeAll(async () => {
    setupLocalDb();
    await saveMockPricesInLocalDb(
      [0.998122, 1992.14, 0.998733, 1, 0.999557],
      ["VST", "ETH", "USDC", "USDT", "DAI"]
    );
  });

  beforeEach(async () => {
    await clearPricesSublevel();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("should properly fetch token with slash", async () => {
    const result = await fetcher.fetchAll(["VST/ETH"]);
    expect(result).toEqual([
      {
        symbol: "VST/ETH",
        value: 0.0005010300480889897,
      },
    ]);
  });

  test("should properly fetch token with dot", async () => {
    const usdcWithUsdt = await fetcher.fetchAll(["USDC.USDT"]);
    const usdcWithDai = await fetcher.fetchAll(["USDC.DAI"]);
    expect(usdcWithUsdt).toEqual([
      {
        symbol: "USDC.USDT",
        value: 0.998733,
      },
    ]);
    expect(usdcWithDai).toEqual([
      {
        symbol: "USDC.DAI",
        value: 0.9991756348062191,
      },
    ]);
  });
});
