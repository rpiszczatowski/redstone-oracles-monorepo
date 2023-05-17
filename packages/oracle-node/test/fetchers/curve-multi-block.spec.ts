import { deployMockContract } from "@ethereum-waffle/mock-contract";
import { MockContract, MockProvider } from "ethereum-waffle";
import { BigNumber } from "ethers";
import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import abi from "../../src/fetchers/curve/CurveFactory.abi.json";
import { CurveFetcher } from "../../src/fetchers/curve/CurveFetcher";
import { MultiBlockCurveFetcher } from "../../src/fetchers/curve/MultiBlockCurveFetcher";
import { saveMockPriceInLocalDb } from "./_helpers";

jest.setTimeout(15_000);
describe("Curve Multi Block", () => {
  let mockContract: MockContract;
  let provider: MockProvider;

  const getMultiBlockCurveFetcher = (
    sequenceStep: number,
    sequenceLength: number
  ) => {
    const curveFetcher = new CurveFetcher("curve-test", {
      STETH: {
        address: mockContract.address,
        tokenIndex: 1,
        pairedTokenIndex: 0,
        pairedToken: "ETH",
        provider,
        ratioMultiplier: 1,
        functionName: "get_dy",
        multiBlockConfig: {
          sequenceStep,
          sequenceLength,
        },
      },
    });

    return new MultiBlockCurveFetcher("curve-multi-block-test", curveFetcher);
  };

  beforeAll(async () => {
    setupLocalDb();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  beforeEach(async () => {
    await saveMockPriceInLocalDb(2104.09, "ETH");
    await clearPricesSublevel();
    provider = new MockProvider();
    const [wallet] = provider.getWallets();
    mockContract = await deployMockContract(wallet, abi);
  });

  test("Should properly fetch data with 1 block", async () => {
    const fetcher = getMultiBlockCurveFetcher(1, 1);

    await mockGetDyCalls(mockContract, [BigNumber.from("1000130962107597656")]);
    const result = await fetcher.fetchAll(["STETH"]);

    expect(result).toEqual([{ symbol: "STETH", value: 2104.365556060975 }]);
  });

  test("Should properly fetch data with 2 block", async () => {
    const fetcher = getMultiBlockCurveFetcher(1, 2);

    await mockGetDyCalls(mockContract, [
      BigNumber.from("2000130962107597656"),
      BigNumber.from("0000130962107597656"),
    ]);
    const result = await fetcher.fetchAll(["STETH"]);

    expect(result).toEqual([{ symbol: "STETH", value: 2104.365556060975 }]);
  });

  test("Should properly fetch data with 7 block", async () => {
    const fetcher = getMultiBlockCurveFetcher(1, 7);

    // 3 smaller values and 3 bigger then 1000130962107597656
    await mockGetDyCalls(mockContract, [
      BigNumber.from("0000130962107597656"),
      BigNumber.from("0000130962107597656"),
      BigNumber.from("0000130962107597656"),
      BigNumber.from("2000130962107597656"),
      BigNumber.from("2000130962107597656"),
      BigNumber.from("2000130962107597656"),
      BigNumber.from("1000130962107597656"),
    ]);
    const result = await fetcher.fetchAll(["STETH"]);

    expect(result).toEqual([{ symbol: "STETH", value: 2104.365556060975 }]);
  });
  test("Should properly fetch data with 7 blocks and sequence step 2", async () => {
    const fetcher = getMultiBlockCurveFetcher(2, 7);

    // 3 smaller values and 3 bigger then 1000130962107597656
    await mockGetDyCalls(mockContract, [
      BigNumber.from("0000130962107597656"), // this
      BigNumber.from("0000130962107597656"),
      BigNumber.from("0000130962107597656"), // this
      BigNumber.from("2000130962107597656"),
      BigNumber.from("2000130962107597656"), // this
      BigNumber.from("2000130962107597656"),
      BigNumber.from("1000130962107597656"), // this
    ]);
    const result = await fetcher.fetchAll(["STETH"]);

    expect(result).toEqual([{ symbol: "STETH", value: 1052.3205560609752 }]);
  });
});

const mockGetDyCalls = async (contract: MockContract, returns: any[]) => {
  for (const item of returns) {
    await contract.mock.get_dy.returns(item);
  }
};
