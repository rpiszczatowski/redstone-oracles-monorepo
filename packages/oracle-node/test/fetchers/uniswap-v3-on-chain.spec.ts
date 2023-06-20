import { MockProvider, deployMockContract } from "ethereum-waffle";
import { closeLocalLevelDB, setupLocalDb } from "../../src/db/local-db";
import { Contract } from "ethers";
import { saveMockPriceInLocalDb } from "./_helpers";
import UniswapV3Pool from "../../src/fetchers/evm-chain/uniswap-v3-on-chain/UniswapV3Pool.abi.json";
import UniswapV3Quoter from "../../src/fetchers/evm-chain/uniswap-v3-on-chain/UniswapV3Quoter.abi.json";

import { UniswapV3OnChainFetcher } from "../../src/fetchers/evm-chain/uniswap-v3-on-chain/UniswapV3OnChainFetcher";
import { PoolsConfig } from "../../src/fetchers/evm-chain/uniswap-v3-on-chain/types";

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
                    { type: "BigNumber", hex: "0x64000000000000000000000000" },
                  ],
                  success: true,
                },
                {
                  returnValues: [
                    [
                      { type: "BigNumber", hex: "0x0be069d1bcc3" },
                      { type: "BigNumber", hex: "0x0be06bf9da3f" },
                    ],
                    [
                      {
                        type: "BigNumber",
                        hex: "0x064404e0fd5ef65a1b6b2fa9f9",
                      },
                      {
                        type: "BigNumber",
                        hex: "0x064404e9bb13c8fbcbef353f14",
                      },
                    ],
                  ],
                  success: true,
                },
              ],
            },
            quoterContract: {
              callsReturnContext: [
                {
                  returnValues: [
                    { fake: "" },
                    { type: "BigNumber", hex: "0x65000000000000000000000000" },
                  ],
                  reference: "1000_buy",
                  methodName: "quoteExactInputSingle",
                  success: true,
                },
                {
                  returnValues: [
                    { fake: "" },
                    { type: "BigNumber", hex: "0x63500000000000000000000000" },
                  ],
                  reference: "1000_sell",
                  methodName: "quoteExactOutputSingle",
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

describe("uniswap V3 fetcher", () => {
  let quoterContract: Contract;
  let poolContract: Contract;
  let provider: MockProvider;
  let mockTokenConfig: PoolsConfig;

  beforeAll(async () => {
    setupLocalDb();
    provider = new MockProvider();
    const [wallet] = provider.getWallets();
    quoterContract = await deployMockContract(wallet, UniswapV3Quoter.abi);
    poolContract = await deployMockContract(wallet, UniswapV3Pool.abi);

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
        slippage: [1000],
      },
    };
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("should properly fetch price", async () => {
    const fetcher = new UniswapV3OnChainFetcher(
      "uniswap-v3-mock",
      mockTokenConfig,
      provider
    );
    await saveMockPriceInLocalDb(1, "MockToken2");
    const result = await fetcher.fetchAll([
      "MockToken",
      "MockToken_test-source_BUY_1K_slippage",
      "MockToken_test-source_SELL_1K_slippage",
      "MockToken_no-config_SELL_10K_slippage", // no config for 10K so no value should be returned
    ]);
    expect(result[0]).toEqual({
      symbol: "MockToken",
      value: 100,
    });
    expect(result[1]).toEqual({
      symbol: "MockToken_test-source_BUY_1K_slippage",
      value: 0.0201,
    });
    expect(result[2]).toEqual({
      symbol: "MockToken_test-source_SELL_1K_slippage",
      value: 0.0137027344,
    });
    expect(result[3]).toBeUndefined();
  });
});
