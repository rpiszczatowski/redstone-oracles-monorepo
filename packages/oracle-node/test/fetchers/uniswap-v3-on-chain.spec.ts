import { MockProvider, deployMockContract } from "ethereum-waffle";
import { closeLocalLevelDB, setupLocalDb } from "../../src/db/local-db";
import { Contract } from "ethers";
import { saveMockPriceInLocalDb } from "./_helpers";
import UniswapV3Pool from "../../src/fetchers/evm-chain/uniswap-v3-on-chain/UniswapV3Pool.abi.json";
import UniswapV3Quoter from "../../src/fetchers/evm-chain/uniswap-v3-on-chain/UniswapV3Quoter.abi.json";


import { UniswapV3FetcherOnChain } from "../../src/fetchers/evm-chain/uniswap-v3-on-chain/UniswapV3FetcherOnChain";
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
                { returnValues: ["0"] },
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
        token1Decimals: 18,
        fee: 5000,
      },
    };
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("should properly fetch price", async () => {
    const fetcher = new UniswapV3FetcherOnChain(
      "uniswap-v3-mock",
      mockTokenConfig,
      provider
    );
    await saveMockPriceInLocalDb(1863.50, "MockToken2");
    const result = await fetcher.fetchAll(["MockToken"]);
    expect(result).toEqual([{ symbol: "MockToken", value: 1.000085578653717 }]);
  });
});
