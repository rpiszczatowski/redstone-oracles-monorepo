import { saveMockPriceInLocalDb } from "./_helpers";
import {
  setupLocalDb,
  clearPricesSublevel,
  closeLocalLevelDB,
  clearLastPricesCache,
} from "../../src/db/local-db";
import {
  calculateSlippage,
  tryConvertUsdToTokenAmount,
} from "../../src/fetchers/SlippageAndLiquidityCommons";

describe("slippage and liquidity commons", () => {
  beforeAll(() => {
    setupLocalDb();
  });

  beforeEach(async () => {
    await clearPricesSublevel();
    clearLastPricesCache();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("should calculate slippage", () => {
    expect(calculateSlippage(1, 1)).toEqual((0).toString());
    expect(calculateSlippage(1, 2)).toEqual((100).toString());
    expect(calculateSlippage(2, 1)).toEqual((50).toString());
  });

  test("should convert usd to token", async () => {
    await saveMockPriceInLocalDb(2000, "ETH");
    expect(tryConvertUsdToTokenAmount("ETH", 1e18, 10000)).toEqual(
      (5e18).toString()
    );
  });

  test("should return undefined if no price available", () => {
    expect(tryConvertUsdToTokenAmount("ETH", 1e18, 10000)).toBeUndefined();
  });

  test("should throw on stale price", async () => {
    await saveMockPriceInLocalDb(
      2,
      "USDC",
      Date.now() - 4 * 60 * 60 * 1000 // stale price
    );
    expect(() => tryConvertUsdToTokenAmount("USDC", 6, 10000)).toThrow();
  });
});
