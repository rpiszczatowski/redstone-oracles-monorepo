import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import fetchers from "../../src/fetchers/index";
import { saveMockPriceInLocalDb } from "./_helpers";

describe("Non USD based fetcher", () => {
  const fetcher = fetchers["non-usd-based"];

  beforeAll(async () => {
    setupLocalDb();
    await saveMockPriceInLocalDb(0.998122, "VST");
    await saveMockPriceInLocalDb(1992.14, "ETH");
  });

  beforeEach(async () => {
    await clearPricesSublevel();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("should properly fetch data", async () => {
    const result = await fetcher.fetchAll(["VST/ETH"]);
    expect(result).toEqual([
      {
        symbol: "VST/ETH",
        value: 0.0005010300480889897,
      },
    ]);
  });
});
