import {
  MockProvider,
  deployMockContract,
  deployContract,
} from "ethereum-waffle";
import {
  clearLastPricesCache,
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import { Contract } from "ethers";
import { asAwaitable, saveMockPriceInLocalDb } from "./_helpers";
import VelodromPool from "../../src/fetchers/evm-chain/optimism/velodrome/abi.json";
import multicall3Json from "../abis/Multicall3.deployment.json";
import { VelodromeOnChainFetcher } from "../../src/fetchers/evm-chain/optimism/velodrome/VelodromeOnChainFetcher";
import { PoolsConfig } from "../../src/fetchers/evm-chain/optimism/velodrome/types";
import { RedstoneCommon } from "@redstone-finance/utils";

const MOCK_TOKEN_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const MOCK_TOKEN2_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc3";

describe("velodrome fetcher", () => {
  let poolContract: Contract;
  let multicall: Contract;
  let provider: MockProvider;
  let mockTokenConfig: PoolsConfig;

  beforeAll(async () => {
    setupLocalDb();
    provider = new MockProvider();
    const [wallet] = provider.getWallets();
    poolContract = await deployMockContract(wallet, VelodromPool.abi);
    multicall = await deployContract(wallet, multicall3Json);
    RedstoneCommon.overrideMulticallAddress(multicall.address);

    mockTokenConfig = {
      MockToken: {
        poolAddress: poolContract.address,
        token0Address: MOCK_TOKEN_ADDRESS,
        token1Address: MOCK_TOKEN2_ADDRESS,
        token0Symbol: "MockToken",
        token1Symbol: "MockToken2",
        token0Decimals: 1,
        token1Decimals: 0,
        stable: false,
      },
      MockTokenStable: {
        poolAddress: poolContract.address,
        token0Address: MOCK_TOKEN_ADDRESS,
        token1Address: MOCK_TOKEN2_ADDRESS,
        token0Symbol: "MockTokenStable",
        token1Symbol: "MockTokenStable2",
        token0Decimals: 1,
        token1Decimals: 0,
        stable: true,
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

  test("should properly fetch price - non-stable pool", async () => {
    const fetcher = new VelodromeOnChainFetcher(
      "velodrome-mock",
      mockTokenConfig,
      provider
    );
    await asAwaitable(
      poolContract.mock.getReserves.returns(
        { type: "BigNumber", hex: "0x64" },
        { type: "BigNumber", hex: "0xa" },
        0
      )
    );
    await asAwaitable(
      poolContract.mock.getAmountOut
        .returns({ type: "BigNumber", hex: "0xa" })
        .returns({ type: "BigNumber", hex: "0x1" })
    );
    await saveMockPriceInLocalDb(10000, "MockToken");
    await saveMockPriceInLocalDb(10000, "MockToken2");
    const result = await fetcher.fetchAll(["MockToken"]);
    expect(result[0]).toEqual({
      symbol: "MockToken",
      value: "10000",
      metadata: {
        slippage: [
          {
            direction: "buy",
            simulationValueInUsd: "10000",
            slippageAsPercent: "22.22222222222222222",
          },
          {
            direction: "sell",
            simulationValueInUsd: "10000",
            slippageAsPercent: "18.181818181818181818",
          },
        ],
      },
    });
  });

  test("should properly fetch price - stable pool", async () => {
    const fetcher = new VelodromeOnChainFetcher(
      "velodrome-mock",
      mockTokenConfig,
      provider
    );
    await asAwaitable(
      poolContract.mock.getReserves.returns(
        { type: "BigNumber", hex: "0x64" },
        { type: "BigNumber", hex: "0xa" },
        0
      )
    );
    await asAwaitable(
      poolContract.mock.getAmountOut
        .returns({ type: "BigNumber", hex: "0xa" })
        .returns({ type: "BigNumber", hex: "0x1" })
    );
    await saveMockPriceInLocalDb(10000, "MockTokenStable");
    await saveMockPriceInLocalDb(10000, "MockTokenStable2");
    const result = await fetcher.fetchAll(["MockTokenStable"]);
    expect(result[0]).toEqual({
      symbol: "MockTokenStable",
      value: "10000",
      metadata: {
        slippage: [
          {
            direction: "buy",
            simulationValueInUsd: "10000",
            slippageAsPercent: "0.2002002002002002",
          },
          {
            direction: "sell",
            simulationValueInUsd: "10000",
            slippageAsPercent: "0.1998001998001998",
          },
        ],
      },
    });
  });
});
