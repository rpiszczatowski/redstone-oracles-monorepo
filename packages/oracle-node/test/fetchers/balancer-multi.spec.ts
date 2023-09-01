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
import { saveMockPriceInLocalDb } from "./_helpers";
import BalancerVaultAbi from "../../src/fetchers/balancer-multi/BalancerVault.abi.json";
import {
  BALANCER_VAULT_ADDRESS,
  BalancerMultiFetcher,
} from "../../src/fetchers/balancer-multi/BalancerMultiFetcher";
import { balancerMultiConfigs } from "../../src/fetchers/balancer-multi/balancer-multi-configs";
import multicall3Json from "../abis/Multicall3.deployment.json";
import { Contract } from "ethers";
import Decimal from "decimal.js";

describe("balancer multi fetcher", () => {
  let provider: MockProvider;
  let multicall: Contract;
  let vaultContract: Contract;

  beforeAll(async () => {
    // make sure numbers longer that 20 digits are not seiralized using scientific notation
    // as ethers failes to parse scientific notation
    Decimal.set({ toExpPos: 9e15 });
    setupLocalDb();

    provider = new MockProvider();
    const [wallet] = provider.getWallets();
    vaultContract = await deployMockContract(wallet, BalancerVaultAbi, {
      address: BALANCER_VAULT_ADDRESS,
    });
    multicall = await deployContract(wallet, multicall3Json);
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

  test("should properly fetch data without slippage", async () => {
    await asAwaitable(
      vaultContract.mock.queryBatchSwap.returns([
        "1000000000000000",
        "-1025056002749498",
      ])
    );

    await saveMockPriceInLocalDb(1635.27, "ETH");

    const fetcher = new BalancerMultiFetcher(
      "balancer-multi-weth-test",
      balancerMultiConfigs.WETH,
      "WETH",
      provider
    );
    fetcher.overrideMulticallAddress(multicall.address);

    const result = await fetcher.fetchAll(["SWETH"]);
    expect(result).toEqual([
      {
        symbol: "SWETH",
        value: "1676.2433296161715945",
        metadata: {
          liquidity: undefined,
          slippage: [],
        },
      },
    ]);
  });

  test("should properly fetch data with slippage", async () => {
    await asAwaitable(
      vaultContract.mock.queryBatchSwap
        .returns(["1000000000000000000000", "0", "0", "-2000000000"]) // 1:2
        .returns(["5000000000000000000000", "0", "0", "-5000000000"]) // 1:1
        .returns(["-2500000000000000000000", "0", "0", "10000000000"]) // 1:4
    );

    await saveMockPriceInLocalDb(1, "USDC");
    await saveMockPriceInLocalDb(2, "GHO");

    const fetcher = new BalancerMultiFetcher(
      "balancer-multi-usdc-test",
      balancerMultiConfigs.USDC,
      "USDC",
      provider
    );
    fetcher.overrideMulticallAddress(multicall.address);

    const result = await fetcher.fetchAll(["GHO"]);
    expect(result).toEqual([
      {
        symbol: "GHO",
        value: "2",
        metadata: {
          liquidity: undefined,
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
      },
    ]);
  });
});
