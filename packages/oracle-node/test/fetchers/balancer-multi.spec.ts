import { MockProvider, deployMockContract } from "ethereum-waffle";
import { closeLocalLevelDB, setupLocalDb } from "../../src/db/local-db";
import { saveMockPriceInLocalDb } from "./_helpers";
import BalancerVaultAbi from "../../src/fetchers/balancer-multi/BalancerVault.abi.json";
import {
  BALANCER_VAULT_ADDRESS,
  BalancerMultiFetcher,
} from "../../src/fetchers/balancer-multi/BalancerMultiFetcher";
import { balancerMultiConfigs } from "../../src/fetchers/balancer-multi/balancer-multi-configs";

describe("balancer multi fetcher", () => {
  let provider: MockProvider;

  beforeAll(async () => {
    setupLocalDb();

    provider = new MockProvider();
    const [wallet] = provider.getWallets();
    const contract = await deployMockContract(wallet, BalancerVaultAbi);
    await contract.mock.queryBatchSwap.returns([
      "1000000000000000",
      "-1023980940581531",
    ]);
    (BALANCER_VAULT_ADDRESS as any) = contract.address;
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("should properly fetch data", async () => {
    await saveMockPriceInLocalDb(1635.27, "ETH");

    const fetcher = new BalancerMultiFetcher(
      "balancer-multi-weth-test",
      balancerMultiConfigs.WETH,
      "WETH",
      provider
    );

    const result = await fetcher.fetchAll(["SWETH"]);
    expect(result).toEqual([
      {
        symbol: "SWETH",
        value: 1674.4853127047602,
      },
    ]);
  });
});
