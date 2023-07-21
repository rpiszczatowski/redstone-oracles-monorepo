import { MockProvider, deployMockContract } from "ethereum-waffle";
import { closeLocalLevelDB, setupLocalDb } from "../../src/db/local-db";
import { saveMockPriceInLocalDb } from "./_helpers";
import BalancerVaultAbi from "../../src/fetchers/balancer-multi/BalancerVault.abi.json";
import {
  BALANCER_VAULT_ADDRESS,
  BalancerMultiFetcher,
} from "../../src/fetchers/balancer-multi/BalancerMultiFetcher";
import { balancerMultiConfigs } from "../../src/fetchers/balancer-multi/balancer-multi-configs";

const mockDeltasResponse = {
  "0xf951e335afb289353dc249e82926178eac7ded78": "1000000000000000",
  "0x60d604890feaa0b5460b28a424407c24fe89374a": "0",
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "-1025056002749498",
};

describe("balancer multi fetcher", () => {
  let provider: MockProvider;

  beforeAll(async () => {
    setupLocalDb();

    provider = new MockProvider();
    const [wallet] = provider.getWallets();
    const contract = await deployMockContract(wallet, BalancerVaultAbi);
    await contract.mock.queryBatchSwap.returns([
      "1000000000000000",
      "0",
      "-1025056002749498",
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
        value: 1676.2433296161716,
      },
    ]);
  });
});
