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
import { BigNumber } from "ethers";

describe("Curve", () => {
  let mockContract: MockContract;
  let provider: MockProvider;

  beforeAll(async () => {
    setupLocalDb();
    provider = new MockProvider();
    const [wallet] = provider.getWallets();
    mockContract = await deployMockContract(wallet, abi);
    // sample data taken from https://etherscan.io/address/0x828b154032950c8ff7cf8085d841723db2696056#readContract get_dy(0,1,10**18)
    await mockContract.mock.get_dy.returns(
      BigNumber.from("1000130962107597656")
    );
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
        fee: 0.00015,
      },
    });

    await saveMockPriceInLocalDb(2104.09, "ETH");

    const result = await fetcher.fetchAll(["STETH"]);

    expect(result).toEqual([{ symbol: "STETH", value: 2104.6812582497128 }]);
  });
});
