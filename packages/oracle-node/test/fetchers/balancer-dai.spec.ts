import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";

import fetchers from "../../src/fetchers/index";
import { saveMockPricesInLocalDb } from "./_helpers";

jest.mock("@balancer-labs/sdk", () => ({
  __esModule: true,
  ...jest.requireActual("@balancer-labs/sdk"),
  BalancerSDK: jest.fn().mockImplementation(() => {
    interface Token {}
    class Pool {
      public tokens: Token[] = [];

      constructor() {
        this.tokens = [
          {
            symbol: "DAI",
          },
          {
            symbol: "OHM",
          },
        ];
      }

      public calcSpotPrice(_token1: string, _token2: string) {
        return 10;
      }
    }
    class Pools {
      public static find() {
        return new Pool();
      }
    }
    return {
      pools: Pools,
    };
  }),
}));

describe("balancer-dai fetcher", () => {
  beforeAll(() => {
    setupLocalDb();
  });
  beforeEach(async () => {
    await clearPricesSublevel();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  const sut = fetchers["balancer-dai"];

  it("should properly fetch data", async () => {
    // Given
    await saveMockPricesInLocalDb([0.99], ["DAI"]);

    // When
    const result = await sut.fetchAll(["OHM"]);
    // Then
    expect(result).toEqual([{ symbol: "OHM", value: 9.9 }]);
  });
});
