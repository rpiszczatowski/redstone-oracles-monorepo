import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import fetchers from "../../src/fetchers/index";
import { saveMockPriceInLocalDb } from "./_helpers";

const mockDeltasResponse = {
  "0xf951e335afb289353dc249e82926178eac7ded78": "1000000000000000",
  "0x60d604890feaa0b5460b28a424407c24fe89374a": "0",
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "-1025056002749498",
};

jest.mock("@balancer-labs/sdk", () => ({
  __esModule: true,
  ...jest.requireActual("@balancer-labs/sdk"),
  BalancerSDK: jest.fn().mockImplementation(() => ({
    swaps: {
      queryExactIn: () => mockDeltasResponse,
    },
  })),
}));

describe("balancer multi fetcher", () => {
  beforeAll(() => {
    setupLocalDb();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("should properly fetch data", async () => {
    await saveMockPriceInLocalDb(1635.27, "ETH");

    const sut = fetchers["balancer-multi-sweth"];

    const result = await sut.fetchAll(["SWETH"]);
    expect(result).toEqual([
      {
        symbol: "SWETH",
        value: 1676.2433296161716,
      },
    ]);
  });
});
