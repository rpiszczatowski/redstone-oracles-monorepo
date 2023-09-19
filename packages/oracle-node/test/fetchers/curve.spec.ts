import { deployMockContract } from "@ethereum-waffle/mock-contract";
import { deployContract, MockContract, MockProvider } from "ethereum-waffle";
import { RedstoneCommon } from "@redstone-finance/utils";
import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import abi from "../../src/fetchers/curve/CurveFactory.abi.json";
import { CurveFetcher } from "../../src/fetchers/curve/CurveFetcher";
import multicall3Json from "../abis/Multicall3.deployment.json";
import { asAwaitable, saveMockPriceInLocalDb } from "./_helpers";

const toCurvePrecision = (value: string) => value + "0".repeat(18);
jest.setTimeout(10_000);

describe("Curve", () => {
  let mockContract: MockContract;
  let provider: MockProvider;

  beforeAll(async () => {
    setupLocalDb();
    provider = new MockProvider();
    const [wallet] = provider.getWallets();
    mockContract = await deployMockContract(wallet, abi);

    const multicall = await deployContract(wallet, multicall3Json);
    RedstoneCommon.overrideMulticallAddress(multicall.address);
  });

  beforeEach(async () => {
    await clearPricesSublevel();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("Should properly fetch data, where tokens have same decimals", async () => {
    // sample data taken from https://etherscan.io/address/0x828b154032950c8ff7cf8085d841723db2696056#readContract get_dy(0,1,10**18)
    await asAwaitable(mockContract.mock.get_dy.returns("1000130962107597656"));

    // for sell slippage x9
    await asAwaitable(
      mockContract.mock.get_dy
        .withArgs(0, 1, toCurvePrecision("10"))
        .returns("9000130962107597656")
    );

    // for buy slippage x10
    await asAwaitable(
      mockContract.mock.get_dy
        .withArgs(1, 0, "9997190746829739307")
        .returns("10001309621075976560")
    );

    await asAwaitable(
      mockContract.mock.balances.withArgs(0).returns(toCurvePrecision("2"))
    );
    await asAwaitable(
      mockContract.mock.balances.withArgs(1).returns(toCurvePrecision("100"))
    );
    await saveMockPriceInLocalDb(1000, "ETH");
    await saveMockPriceInLocalDb(1000.2810042582364, "STETH");

    const fetcher = new CurveFetcher("curve-test", {
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
      },
    });

    // 2104.09 * 2 + 1000 * 100
    const result = await fetcher.fetchAll(["STETH"]);

    expect(result).toEqual([
      {
        symbol: "STETH",
        value: 1000.2810042582364,
        metadata: {
          liquidity: "102028.10042582364",
          slippage: [
            {
              direction: "buy",
              simulationValueInUsd: "10000",
              slippageAsPercent: "9.9869036177294981357",
            },
            {
              direction: "sell",
              simulationValueInUsd: "10000",
              slippageAsPercent: "0.028100425823640004507",
            },
          ],
        },
      },
    ]);
  });

  test("Should properly fetch data, where tokens have different decimals", async () => {
    // sample data taken from https://etherscan.io/address/0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7#readContract
    await asAwaitable(
      mockContract.mock.get_dy
        .withArgs(0, 1, toCurvePrecision("1"))
        .returns("999835")
    );
    await asAwaitable(
      mockContract.mock.get_dy
        .withArgs(1, 0, "1000000")
        .returns("999965813579867719")
    );

    await asAwaitable(
      mockContract.mock.get_dy
        .withArgs(0, 1, "10000150024754084918000")
        .returns("9998339080")
    );

    await asAwaitable(
      mockContract.mock.get_dy
        .withArgs(1, 0, "10000000000")
        .returns("9999655307777900385229")
    );

    await saveMockPriceInLocalDb(0.9999849977496624, "STETH");
    await saveMockPriceInLocalDb(1, "USDT");

    await asAwaitable(
      mockContract.mock.balances.withArgs(0).returns(toCurvePrecision("2"))
    );
    await asAwaitable(
      mockContract.mock.balances.withArgs(1).returns("3000000")
    );

    const fetcher = new CurveFetcher("curve-test", {
      STETH: {
        address: mockContract.address,
        tokenIndex: 0,
        pairedTokenIndex: 1,
        pairedToken: "USDT",
        provider,
        tokenDecimalsMultiplier: 1e18,
        pairedTokenDecimalsMultiplier: 1e6,
        functionName: "get_dy",
        fee: 0.00015,
      },
    });

    // 2104.09 * 2 + 1000 * 100
    const result = await fetcher.fetchAll(["STETH"]);

    expect(result).toEqual([
      {
        symbol: "STETH",
        value: 0.9999849977496624,
        metadata: {
          liquidity: "4.9999699954993248",
          slippage: [
            {
              direction: "buy",
              simulationValueInUsd: "10000",
              slippageAsPercent: "0.019946353478829681342",
            },
            {
              direction: "sell",
              simulationValueInUsd: "10000",
              slippageAsPercent: "0.0016094414162173728665",
            },
          ],
        },
      },
    ]);
  });
});
