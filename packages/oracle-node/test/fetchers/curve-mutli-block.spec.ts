import { MockContract, MockProvider } from "ethereum-waffle";
import { MultiBlockCurveFetcher } from "../../src/fetchers/curve/MultiBlockCurveFetcher";
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

describe("Curve Multi Block", () => {
  let mockContract: MockContract;
  let provider: MockProvider;
  // let cur;

  beforeAll(async () => {
    setupLocalDb();
    provider = new MockProvider();
    const [wallet] = provider.getWallets();
    mockContract = await deployMockContract(wallet, abi);
    // sample data taken from https://etherscan.io/address/0x828b154032950c8ff7cf8085d841723db2696056#readContract get_dy(0,1,10**18)
  });

  beforeEach(async () => {
    await clearPricesSublevel();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("Should properly fetch data with 1 block", async () => {
    const fetcher = new CurveFetcher("curve-test", {
      STETH: {
        address: mockContract.address,
        tokenIndex: 1,
        pairedTokenIndex: 0,
        pairedToken: "ETH",
        provider,
        ratioMultiplier: 1,
        functionName: "get_dy",
        multiBlockConfig: {
          sequenceStep: 1,
          sequenceLength: 1,
        },
      },
    });

    const multiBlocKFetcher = new MultiBlockCurveFetcher(
      "curve-multi-block-test",
      fetcher
    );

    await saveMockPriceInLocalDb(2104.09, "ETH");

    await mockGetDyCalls(mockContract, [BigNumber.from("1000130962107597656")]);
    const result = await multiBlocKFetcher.fetchAll(["STETH"]);

    expect(result).toEqual([{ symbol: "STETH", value: 2104.365556060975 }]);
  });

  test("Should properly fetch data with 2 block", async () => {
    const fetcher = new CurveFetcher("curve-test", {
      STETH: {
        address: mockContract.address,
        tokenIndex: 1,
        pairedTokenIndex: 0,
        pairedToken: "ETH",
        provider,
        ratioMultiplier: 1,
        functionName: "get_dy",
        multiBlockConfig: {
          sequenceStep: 1,
          sequenceLength: 2,
        },
      },
    });

    const multiBlocKFetcher = new MultiBlockCurveFetcher(
      "curve-multi-block-test",
      fetcher
    );

    await saveMockPriceInLocalDb(2104.09, "ETH");

    await mockGetDyCalls(mockContract, [
      BigNumber.from("2000130962107597656"),
      BigNumber.from("0000130962107597656"),
    ]);
    const result = await multiBlocKFetcher.fetchAll(["STETH"]);

    expect(result).toEqual([{ symbol: "STETH", value: 2104.365556060975 }]);
  });

  test("Should properly fetch data with 7 block", async () => {
    const fetcher = new CurveFetcher("curve-test", {
      STETH: {
        address: mockContract.address,
        tokenIndex: 1,
        pairedTokenIndex: 0,
        pairedToken: "ETH",
        provider,
        ratioMultiplier: 1,
        functionName: "get_dy",
        multiBlockConfig: {
          sequenceStep: 1,
          sequenceLength: 7,
        },
      },
    });

    const multiBlocKFetcher = new MultiBlockCurveFetcher(
      "curve-multi-block-test",
      fetcher
    );

    await saveMockPriceInLocalDb(2104.09, "ETH");

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
    const result = await multiBlocKFetcher.fetchAll(["STETH"]);

    expect(result).toEqual([{ symbol: "STETH", value: 2104.365556060975 }]);
  });
  test("Should properly fetch data with 7 blocks and sequence step 2", async () => {
    const fetcher = new CurveFetcher("curve-test", {
      STETH: {
        address: mockContract.address,
        tokenIndex: 1,
        pairedTokenIndex: 0,
        pairedToken: "ETH",
        provider,
        ratioMultiplier: 1,
        functionName: "get_dy",
        multiBlockConfig: {
          sequenceStep: 2,
          sequenceLength: 7,
        },
      },
    });

    const multiBlocKFetcher = new MultiBlockCurveFetcher(
      "curve-multi-block-test",
      fetcher
    );

    await saveMockPriceInLocalDb(2104.09, "ETH");

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
    const result = await multiBlocKFetcher.fetchAll(["STETH"]);

    expect(result).toEqual([{ symbol: "STETH", value: 1052.3205560609752 }]);
  });
});

const mockGetDyCalls = async (contract: MockContract, returns: any[]) => {
  for (const item of returns) {
    await contract.mock.get_dy.returns(item);
  }
};
