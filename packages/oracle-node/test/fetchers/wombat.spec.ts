import { MockContract, MockProvider, deployContract } from "ethereum-waffle";
import { deployMockContract } from "@ethereum-waffle/mock-contract";
import {
  WombatFetcher,
  FetcherConfig,
} from "../../src/fetchers/wombat/WombatFetcher";
import { asAwaitable, saveMockPriceInLocalDb } from "./_helpers";
import {
  clearLastPricesCache,
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import { WOMBAT_POOL_ABI } from "../../src/fetchers/wombat/pool.abi";
import multicall3Json from "../abis/Multicall3.deployment.json";
import { RedstoneCommon } from "redstone-utils";
import { DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE } from "../../src/fetchers/SlippageAndLiquidityCommons";

describe("Wombat", () => {
  let mockContract: MockContract;
  let provider: MockProvider;
  let config: FetcherConfig;

  beforeAll(async () => {
    setupLocalDb();
    provider = new MockProvider();
    const [wallet] = provider.getWallets();
    const multicall = await deployContract(wallet, multicall3Json);
    RedstoneCommon.overrideMulticallAddress(multicall.address);
    mockContract = await deployMockContract(wallet, WOMBAT_POOL_ABI);
    config = {
      provider,
      tokens: {
        ETHx: {
          baseToken: {
            address: "0xA35b1B31Ce002FBF2058D22F30f95D405200A15b",
            symbol: "ETHx",
            decimals: 18,
          },
          quoteToken: {
            address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
            symbol: "WETH",
            decimals: 18,
          },
          pairedToken: "ETH",
          poolAddress: mockContract.address,
        },
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

  test("should properly fetch data, no slippage", async () => {
    await asAwaitable(
      mockContract.mock.quotePotentialSwap.returns("1000000000000000000", "0")
    );
    const fetcher = new WombatFetcher(config);

    await saveMockPriceInLocalDb(2000, "ETH");

    const result = await fetcher.fetchAll(["ETHx"]);

    expect(result).toEqual([
      {
        symbol: "ETHx",
        value: "2000",
        metadata: {
          slippage: [],
          liquidity: undefined,
        },
      },
    ]);
  });

  it("should properly fetch data with slippage", async () => {
    const fetcher = new WombatFetcher(config);

    await saveMockPriceInLocalDb(2000, "ETH");
    await saveMockPriceInLocalDb(2000, "ETHx");

    await asAwaitable(
      mockContract.mock.quotePotentialSwap
        .returns("1000000000000000000", "0")
        .returns("2500000000000000000", "0")
        .returns("2500000000000000000", "0")
    );

    const result = await fetcher.fetchAll(["ETHx"]);

    expect(result).toEqual([
      {
        symbol: "ETHx",
        value: "2000",
        metadata: {
          slippage: [
            {
              direction: "buy",
              simulationValueInUsd:
                DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE.toString(),
              slippageAsPercent: "100",
            },
            {
              direction: "sell",
              simulationValueInUsd:
                DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE.toString(),
              slippageAsPercent: "100",
            },
          ],
          liquidity: undefined,
        },
      },
    ]);
  });
});
