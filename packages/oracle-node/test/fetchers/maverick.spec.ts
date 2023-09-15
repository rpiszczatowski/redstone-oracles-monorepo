import { MockContract, MockProvider, deployContract } from "ethereum-waffle";
import { deployMockContract } from "@ethereum-waffle/mock-contract";
import { MaverickFetcher } from "../../src/fetchers/maverick/MaverickFetcher";
import { saveMockPriceInLocalDb } from "./_helpers";
import {
  clearLastPricesCache,
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import { BigNumber } from "ethers";
import { MAVERICK_POOL_INFORMATION_ABI } from "../../src/fetchers/maverick/pool-information.abi";
import multicall3Json from "../abis/Multicall3.deployment.json";
import { RedstoneCommon } from "@redstone-finance/utils";
import { DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE } from "../../src/fetchers/SlippageAndLiquidityCommons";

describe("Maverick", () => {
  let mockContract: MockContract;
  let provider: MockProvider;

  beforeAll(async () => {
    setupLocalDb();
    provider = new MockProvider();
    const [wallet] = provider.getWallets();
    const multicall = await deployContract(wallet, multicall3Json as any);
    RedstoneCommon.overrideMulticallAddress(multicall.address);
    mockContract = await deployMockContract(
      wallet,
      MAVERICK_POOL_INFORMATION_ABI
    );
    // sample data taken from https://etherscan.io/address/0xadc6ced7666779ede88e82c95e363450ac59bfd3#readContract#F5 0x991322eE666ec384eEb31bbD97b4DC0C2DF14ce1
    await mockContract.mock.getSqrtPrice.returns(
      BigNumber.from("1010994351122103028")
    );
  });

  beforeEach(async () => {
    await clearPricesSublevel();
    await clearLastPricesCache();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("should return empty list for slippage and undefined liquidity, when SWETH not in local DB", async () => {
    const fetcher = new MaverickFetcher({
      poolInformationAddress: mockContract.address,
      provider: provider,
      tokens: {
        SWETH: {
          poolAddress: mockContract.address,
          pairedToken: "ETH",
          token0Decimals: 18,
          token1Decimals: 18,
          token0Symbol: "SWETH",
          token1Symbol: "WETH",
        },
      },
    });

    await saveMockPriceInLocalDb(1850, "ETH");

    const result = await fetcher.fetchAll(["SWETH"]);

    expect(result).toEqual([
      {
        symbol: "SWETH",
        value: 1890.902719301484,
        metadata: {
          slippage: [],
          liquidity: undefined,
        },
      },
    ]);
  });

  it("should calculate slippage when price defined in local DB", async () => {
    const fetcher = new MaverickFetcher({
      poolInformationAddress: mockContract.address,
      provider: provider,
      tokens: {
        SWETH: {
          poolAddress: mockContract.address,
          pairedToken: "ETH",
          token0Decimals: 18,
          token1Decimals: 18,
          token0Symbol: "SWETH",
          token1Symbol: "WETH",
        },
      },
    });

    await saveMockPriceInLocalDb(1850, "ETH");
    await saveMockPriceInLocalDb(1850, "SWETH");

    await mockContract.mock.calculateSwap.returns("1");

    const result = await fetcher.fetchAll(["SWETH"]);

    expect(result).toEqual([
      {
        symbol: "SWETH",
        value: 1890.902719301484,
        metadata: {
          slippage: [
            {
              direction: "buy",
              simulationValueInUsd:
                DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE.toString(),
              slippageAsPercent: "80",
            },
            {
              direction: "sell",
              simulationValueInUsd:
                DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE.toString(),
              slippageAsPercent: "80",
            },
          ],
          liquidity: undefined,
        },
      },
    ]);
  });
});
