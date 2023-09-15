import { deployMockContract } from "@ethereum-waffle/mock-contract";
import { deployContract, MockContract, MockProvider } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { RedstoneCommon } from "@redstone-finance/utils";
import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import abi from "../../src/fetchers/curve/CurveFactory.abi.json";
import { CurveFetcher } from "../../src/fetchers/curve/CurveFetcher";
import {
  generateRoundedStepSequence,
  MultiBlockCurveFetcher,
} from "../../src/fetchers/curve/MultiBlockCurveFetcher";
import multicall3Json from "../abis/Multicall3.deployment.json";
import { saveMockPriceInLocalDb } from "./_helpers";

jest.setTimeout(15_000);
const toCurvePrecision = (value: string) => value + "0".repeat(18);

describe("Curve Multi Block", () => {
  let mockContract: MockContract;
  let provider: MockProvider;

  const getMultiBlockCurveFetcher = (
    sequenceStep: number,
    intervalLength: number
  ) => {
    const curveFetcher = new CurveFetcher("curve-test", {
      STETH: {
        address: mockContract.address,
        tokenIndex: 1,
        pairedTokenIndex: 0,
        pairedToken: "ETH",
        provider,
        tokenDecimalsMultiplier: 1e18,
        pairedTokenDecimalsMultiplier: 1e18,
        functionName: "get_dy",
        fee: 0.00015,
        multiBlockConfig: {
          sequenceStep,
          intervalLength,
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
    await saveMockPriceInLocalDb(2104.6812582497123, "STETH");
    await clearPricesSublevel();
    provider = new MockProvider();
    const [wallet] = provider.getWallets();
    const multicall = await deployContract(wallet, multicall3Json as any);
    RedstoneCommon.overrideMulticallAddress(multicall.address);
    mockContract = await deployMockContract(wallet, abi);
    await mockContract.mock.balances.withArgs(0).returns(toCurvePrecision("2"));
    await mockContract.mock.balances
      .withArgs(1)
      .returns(toCurvePrecision("100"));
  });

  test("Should properly fetch data with 1 block", async () => {
    const fetcher = getMultiBlockCurveFetcher(1, 1);

    await mockGetDyCalls(mockContract, ["1000130962107597656"]);
    const result = await fetcher.fetchAll(["STETH"]);

    expect(result).toEqual([
      {
        symbol: "STETH",
        value: 2104.6812582497123,
        metadata: {
          liquidity: "214676.30582497123",
          slippage: [
            {
              direction: "buy",
              simulationValueInUsd: "10000",
              slippageAsPercent: "78.95358851790647307",
            },
            {
              direction: "sell",
              simulationValueInUsd: "10000",
              slippageAsPercent: "78.953187417502875822",
            },
          ],
        },
      },
    ]);
  });

  test("Should properly fetch data with 2 block", async () => {
    const fetcher = getMultiBlockCurveFetcher(1, 2);

    await mockGetDyCalls(mockContract, [
      "2000130962107597656",
      "0000130962107597656",
    ]);
    const result = await fetcher.fetchAll(["STETH"]);

    expect(result).toEqual([
      {
        symbol: "STETH",
        value: 2104.6812582497178,
        metadata: {
          liquidity: "214676.30582497123",
          slippage: [
            {
              direction: "buy",
              simulationValueInUsd: "10000",
              slippageAsPercent: "78.953588517906422565",
            },
            {
              direction: "sell",
              simulationValueInUsd: "10000",
              slippageAsPercent: "78.953187417502926328",
            },
          ],
        },
      },
    ]);
  });

  test("Should properly fetch data with 7 block", async () => {
    const fetcher = getMultiBlockCurveFetcher(1, 7);

    // 3 smaller values and 3 bigger than 1000130962107597656
    await mockGetDyCalls(mockContract, [
      "0000130962107597656",
      "0000130962107597656",
      "0000130962107597656",
      "2000130962107597656",
      "2000130962107597656",
      "2000130962107597656",
      "1000130962107597656",
    ]);
    const result = await fetcher.fetchAll(["STETH"]);

    expect(result).toEqual([
      {
        symbol: "STETH",
        value: 2104.6812582497123,
        metadata: {
          liquidity: "214676.30582497123",
          slippage: [
            {
              direction: "buy",
              simulationValueInUsd: "10000",
              slippageAsPercent: "78.95358851790647307",
            },
            {
              direction: "sell",
              simulationValueInUsd: "10000",
              slippageAsPercent: "78.953187417502875822",
            },
          ],
        },
      },
    ]);
  });

  test("Should properly fetch data with 6 blocks", async () => {
    const fetcher = getMultiBlockCurveFetcher(1, 6);

    // 3 smaller values and 3 bigger than 1000130962107597656
    await mockGetDyCalls(mockContract, [
      "0010130962107597656",
      "0010130962107597656",
      "0010130962107597656",
      "3000130962107597656",
      "3000130962107597656",
      "1000130962107597656",
    ]);
    const result = await fetcher.fetchAll(["STETH"]);

    expect(result).toEqual([
      {
        symbol: "STETH",
        value: 1063.0004561293995,
        metadata: {
          liquidity: "214676.30582497123",
          slippage: [
            {
              direction: "buy",
              simulationValueInUsd: "10000",
              slippageAsPercent: "89.37019802040824957",
            },
            {
              direction: "sell",
              simulationValueInUsd: "10000",
              slippageAsPercent: "58.328492021941657519",
            },
          ],
        },
      },
    ]);
  });

  describe("generateRoundedToStepSequence", () => {
    it.each([
      [
        [9, 10, 1],
        [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
      ],
      [
        [9, 10, 2],
        [9, 8, 6, 4, 2],
      ],
      [
        [1023, 50, 10],
        [1023, 1020, 1010, 1000, 990],
      ],
      [
        [1322349, 500, 50],
        [
          1322349, 1322300, 1322250, 1322200, 1322150, 1322100, 1322050,
          1322000, 1321950, 1321900,
        ],
      ],
      [
        [100, 50, 10],
        [100, 90, 80, 70, 60],
      ],
    ])("should generate sequence", (params: number[], expected: number[]) => {
      expect(
        generateRoundedStepSequence(params[0], params[1], params[2])
      ).toEqual(expected);
    });
  });
});

const mockGetDyCalls = async (contract: MockContract, returns: any[]) => {
  // this is the mock for slippage requests
  await contract.mock.get_dy.returns("1000130962107597656");
  for (const item of returns) {
    await contract.mock.get_dy
      .withArgs(1, 0, toCurvePrecision("1"))
      .returns(item);
  }
};
