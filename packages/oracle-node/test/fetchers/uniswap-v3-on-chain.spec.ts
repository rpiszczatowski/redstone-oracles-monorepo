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
import { UniswapV3OnChainFetcher } from "../../src/fetchers/evm-chain/shared/uniswap-v3-on-chain/UniswapV3OnChainFetcher";
import { PoolsConfig } from "../../src/fetchers/uniswap-v3-like/types";
import { saveMockPriceInLocalDb } from "./_helpers";
import UniswapV3Pool from "../../src/fetchers/evm-chain/shared/uniswap-v3-on-chain/UniswapV3Pool.abi.json";
import UniswapV3Quoter from "../../src/fetchers/evm-chain/shared/uniswap-v3-on-chain/UniswapV3Quoter.abi.json";
import multicall3Json from "../abis/Multicall3.deployment.json";
import Decimal from "decimal.js";

const MOCK_TOKEN_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

describe("uniswap V3 fetcher", () => {
  let quoterContract: Contract;
  let poolContract: Contract;
  let multicall: Contract;
  let provider: MockProvider;
  let mockTokenConfig: PoolsConfig;

  beforeAll(async () => {
    // make sure numbers longer that 20 digits are not seiralized using scientific notation
    // as ethers failes to parse scientific notation
    Decimal.set({ toExpPos: 9e15 });

    setupLocalDb();
    provider = new MockProvider();
    const [wallet] = provider.getWallets();
    quoterContract = await deployMockContract(wallet, UniswapV3Quoter.abi);
    poolContract = await deployMockContract(wallet, UniswapV3Pool.abi);
    multicall = await deployContract(wallet, multicall3Json);

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

  // despite of the supposedly synchronous interface waffle mock setup has to be awaited, quiet the compiler
  const asAwaitable = <T = void>(awaitableObject: any): Promise<T> => {
    return awaitableObject as unknown as Promise<T>;
  };

  test("should properly fetch price with slippage", async () => {
    await asAwaitable(
      poolContract.mock.slot0.returns(
        { type: "BigNumber", hex: "0x64000000000000000000000000" }, // 100:1
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
        .returns(50_000_000, 0, 0, 0)
        .returns(500_000_000_000, 0, 0, 0)
    );

    const fetcher = new UniswapV3OnChainFetcher(
      "uniswap-v3-mock",
      mockTokenConfig,
      provider
    );
    fetcher.overrideMulticallAddress(multicall.address);

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

  test("should properly fetch price without slippage", async () => {
    await asAwaitable(
      poolContract.mock.slot0.returns(
        { type: "BigNumber", hex: "0x64000000000000000000000000" }, // 100:1
        0,
        0,
        0,
        0,
        0,
        true
      )
    );

    const fetcher = new UniswapV3OnChainFetcher(
      "uniswap-v3-mock",
      mockTokenConfig,
      provider
    );
    fetcher.overrideMulticallAddress(multicall.address);

    await saveMockPriceInLocalDb(1, "MockToken2");
    const result = await fetcher.fetchAll(["MockToken"]);
    expect(result[0]).toEqual({
      symbol: "MockToken",
      value: "100",
      metadata: {
        slippage: [],
      },
    });
  });
});
