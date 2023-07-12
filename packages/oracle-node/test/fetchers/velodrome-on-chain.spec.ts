import { MockProvider, deployMockContract } from "ethereum-waffle";
import { closeLocalLevelDB, setupLocalDb } from "../../src/db/local-db";
import { Contract } from "ethers";
import { saveMockPriceInLocalDb } from "./_helpers";
import VelodromPool from "../../src/fetchers/evm-chain/optimism/velodrome/abi.json";

import { VelodromeOnChainFetcher } from "../../src/fetchers/evm-chain/optimism/velodrome/VelodromeOnChainFetcher";
import { PoolsConfig } from "../../src/fetchers/evm-chain/optimism/velodrome/types";

jest.setTimeout(10000);

jest.mock("ethereum-multicall", () => {
  return {
    Multicall: jest.fn().mockImplementation(() => {
      return {
        call: jest.fn().mockResolvedValue({
          results: {
            poolContract: {
              callsReturnContext: [
                {
                  returnValues: [
                    { type: "BigNumber", hex: "0x64" },
                    { type: "BigNumber", hex: "0xa" },
                  ],
                  success: true,
                },
                {
                  returnValues: [
                    { type: "BigNumber", hex: "0xa" },
                  ],
                  reference: "1_buy",
                  methodName: "getAmountOut",
                  methodParameters: [
                    1,
                    MOCK_TOKEN2_ADDRESS
                  ],
                  success: true,
                },
                {
                  returnValues: [
                    { type: "BigNumber", hex: "0x1" },
                  ],
                  reference: "1_sell",
                  methodName: "getAmountOut",
                  methodParameters: [
                    10,
                    MOCK_TOKEN_ADDRESS
                  ],
                  success: true,
                },
              ],
            },
          },
        }),
      };
    }),
  };
});

const MOCK_TOKEN_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const MOCK_TOKEN2_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc3";

describe("velodrome fetcher", () => {
  let poolContract: Contract;
  let provider: MockProvider;
  let mockTokenConfig: PoolsConfig;

  beforeAll(async () => {
    setupLocalDb();
    provider = new MockProvider();
    const [wallet] = provider.getWallets();
    poolContract = await deployMockContract(wallet, VelodromPool.abi);

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
        slippage: [1],
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
        slippage: [1],
      },
    };
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("should properly fetch price", async () => {
    const fetcher = new VelodromeOnChainFetcher(
      "velodrome-mock",
      mockTokenConfig,
      provider
    );
    await saveMockPriceInLocalDb(1, "MockToken2");
    await saveMockPriceInLocalDb(1, "MockTokenStable2");
    const result = await fetcher.fetchAll([
      "MockToken",
      "MockToken_test-source_BUY_1_slippage",
      "MockToken_test-source_SELL_1_slippage",
      "MockToken_no-config_SELL_10_slippage", // no config for 10 so no value should be returned
      "MockTokenStable",
      "MockTokenStable_test-source_BUY_1_slippage",
      "MockTokenStable_test-source_SELL_1_slippage",
    ]);
    expect(result[0]).toEqual({
      symbol: "MockToken",
      value: 1,
    });
    expect(result[1]).toEqual({
      symbol: "MockToken_test-source_BUY_1_slippage",
      value: 0.2222222222,
    });
    expect(result[2]).toEqual({
      symbol: "MockToken_test-source_SELL_1_slippage",
      value: 0.1818181818,
    });
    expect(result[3]).toEqual({
      symbol: "MockTokenStable",
      value: 1,
    });
    expect(result[4]).toEqual({
      symbol: "MockTokenStable_test-source_BUY_1_slippage",
      value: 0.002002002,
    });
    expect(result[5]).toEqual({
      symbol: "MockTokenStable_test-source_SELL_1_slippage",
      value: 0.001998002,
    });
  });
});
