import { MockContract, MockProvider } from "ethereum-waffle";
import { deployMockContract } from "@ethereum-waffle/mock-contract";
import { CurveFetcher } from "../../src/fetchers/curve/CurveFetcher";
import { saveMockPriceInLocalDb } from "./_helpers";
import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import abi from "../../src/fetchers/curve/CurveFactory.abi.json";

describe("Curve", () => {
  let mockContract: MockContract;
  let provider: MockProvider;

  beforeAll(async () => {
    setupLocalDb();
    provider = new MockProvider();
    const [wallet] = provider.getWallets();
    mockContract = await deployMockContract(wallet, abi);
    await mockContract.mock.get_dy.returns(99857292);
  });

  beforeEach(async () => {
    await clearPricesSublevel();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("Should properly fetch data", async () => {
    const fetcher = new CurveFetcher("curve-test", {
      STETH: {
        address: mockContract.address,
        tokenIndex: 1,
        pairedTokenIndex: 0,
        pairedToken: "ETH",
        provider,
        ratioMultiplier: 1,
        functionName: "get_dy",
      },
    });

    await saveMockPriceInLocalDb(2104.09, "ETH");

    const result = await fetcher.fetchAll(["STETH"]);

    expect(result).toEqual([{ symbol: "STETH", value: 2101.0872952428 }]);
  });
});
