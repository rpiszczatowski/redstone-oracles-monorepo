import {
  MockProvider,
  deployMockContract,
  deployContract,
  MockContract,
} from "ethereum-waffle";
import {
  clearLastPricesCache,
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import { Contract } from "ethers";
import { CamelotV3Fetcher } from "../../src/fetchers/evm-chain/arbitrum/camelot-v3/CamelotV3Fetcher";
import { PoolsConfig } from "../../src/fetchers/uniswap-v3-like/types";
import { asAwaitable, saveMockPriceInLocalDb } from "./_helpers";
import multicall3Json from "../abis/Multicall3.deployment.json";
import CamelotPoolAbi from "../../src/fetchers/evm-chain/arbitrum/camelot-v3/CamelotPool.abi.json";
import CamelotQuoter from "../../src/fetchers/evm-chain/arbitrum/camelot-v3/CamelotQuoter.abi.json";
import { RedstoneCommon } from "@redstone-finance/utils";

const MOCK_TOKEN_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

describe("Camelot V3 fetcher", () => {
  let quoterContract: MockContract;
  let poolContract: MockContract;
  let multicall: Contract;
  let provider: MockProvider;
  let mockTokenConfig: PoolsConfig;

  beforeAll(async () => {
    setupLocalDb();
    provider = new MockProvider();
    const [wallet] = provider.getWallets();
    quoterContract = await deployMockContract(wallet, CamelotQuoter);
    poolContract = await deployMockContract(wallet, CamelotPoolAbi);
    multicall = await deployContract(wallet, multicall3Json);
    RedstoneCommon.overrideMulticallAddress(multicall.address);

    mockTokenConfig = {
      MockToken: {
        poolAddress: poolContract.address,
        quoterAddress: quoterContract.address,
        token0Address: MOCK_TOKEN_ADDRESS,
        token1Address: MOCK_TOKEN_ADDRESS,
        token0Symbol: "MockToken",
        token1Symbol: "MockToken2",
        token0Decimals: 6,
        token1Decimals: 8,
        fee: 5000,
      },
    };
  });

  beforeEach(async () => {
    await clearPricesSublevel();
    clearLastPricesCache();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("should properly fetch price", async () => {
    await asAwaitable(
      poolContract.mock.globalState.returns(
        { type: "BigNumber", hex: "0x64000000000000000000000000" }, // 100:1
        0,
        0,
        0,
        0,
        0,
        0,
        true
      )
    );
    await asAwaitable(
      quoterContract.mock.quoteExactInputSingle
        .returns(50_000_000, 0)
        .returns(500_000_000_000, 0)
    );

    const fetcher = new CamelotV3Fetcher(
      "uniswap-v3-mock",
      mockTokenConfig,
      provider
    );

    await saveMockPriceInLocalDb(100, "MockToken");
    await saveMockPriceInLocalDb(1, "MockToken2");
    const result = await fetcher.fetchAll(["MockToken"]);
    expect(result[0]).toEqual({
      symbol: "MockToken",
      value: "100",
      metadata: {
        slippage: [
          {
            direction: "buy",
            simulationValueInUsd: "10000",
            slippageAsPercent: "100",
          },
          {
            direction: "sell",
            simulationValueInUsd: "10000",
            slippageAsPercent: "100",
          },
        ],
      },
    });
  });
});
