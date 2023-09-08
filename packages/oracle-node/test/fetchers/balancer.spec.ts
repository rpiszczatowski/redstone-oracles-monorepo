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
import { asAwaitable, saveMockPriceInLocalDb } from "./_helpers";
import BalancerVaultAbi from "../../src/fetchers/balancer/BalancerVault.abi.json";
import {
  BALANCER_VAULT_ADDRESS,
  BalancerFetcher,
} from "../../src/fetchers/balancer/BalancerFetcher";
import { balancerEthereumConfigs } from "../../src/fetchers/balancer/balancer-ethereum-configs";
import multicall3Json from "../abis/Multicall3.deployment.json";
import { Contract } from "ethers";
import Decimal from "decimal.js";
import { RedstoneCommon } from "redstone-utils";

describe("balancer multi fetcher", () => {
  let provider: MockProvider;
  let multicall: Contract;
  let vaultContract: MockContract;

  beforeAll(async () => {
    // make sure numbers longer that 20 digits are not serialized using scientific notation
    // as ethers fails to parse scientific notation
    Decimal.set({ toExpPos: 9e15 });
    setupLocalDb();

    provider = new MockProvider();
    const [wallet] = provider.getWallets();
    vaultContract = await deployMockContract(wallet, BalancerVaultAbi, {
      address: BALANCER_VAULT_ADDRESS,
    });
    multicall = await deployContract(wallet, multicall3Json);
    RedstoneCommon.overrideMulticallAddress(multicall.address);
  });

  beforeEach(async () => {
    await clearPricesSublevel();
    clearLastPricesCache();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("should properly fetch data without slippage", async () => {
    await asAwaitable(
      vaultContract.mock.queryBatchSwap.returns([
        "1000000000000000",
        "-1025056002749498",
      ])
    );

    await saveMockPriceInLocalDb(1635.27, "ETH");

    const fetcher = new BalancerFetcher(
      "balancer-weth-test",
      balancerEthereumConfigs.WETH,
      "WETH",
      provider
    );

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
        .returns(["1000000000000000000000", "0", "-2000000000"]) // 1:2
        .returns(["5000000000000000000000", "0", "-5000000000"]) // 1:1
        .returns(["-2500000000000000000000", "0", "10000000000"]) // 1:4
    );

    await saveMockPriceInLocalDb(1, "USDC");
    await saveMockPriceInLocalDb(2, "GHO");

    const fetcher = new BalancerFetcher(
      "balancer-usdc-test",
      balancerEthereumConfigs.USDC,
      "USDC",
      provider
    );

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
