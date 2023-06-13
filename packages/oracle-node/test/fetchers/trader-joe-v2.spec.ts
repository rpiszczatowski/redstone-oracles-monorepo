import {
  MockContract,
  MockProvider,
  deployMockContract,
} from "ethereum-waffle";
import { TraderJoeV2OnChainFetcher } from "../../src/fetchers/evm-chain/avalanche/trader-joe-on-chain/trader-joe-v2/TraderJoeV2OnChainFetcher";
import abi from "../../src/fetchers/evm-chain/avalanche/trader-joe-on-chain/trader-joe-v2/TraderJoeV2LBPair.abi.json";
import configs from "../../src/fetchers/evm-chain/avalanche/trader-joe-on-chain/trader-joe-v2/trader-joe-v2-on-chain-fetchers-configs.json";

describe("Trader Joe - EUROC token", () => {
  let traderJoeV2Contract: MockContract;
  let provider: MockProvider;

  beforeAll(async () => {
    provider = new MockProvider();
    const [wallet] = provider.getWallets();

    traderJoeV2Contract = await deployMockContract(wallet, abi);
    await traderJoeV2Contract.mock.getActiveId.returns(8388754);
    await traderJoeV2Contract.mock.getBinStep.returns(5);
  });

  test("Should properly fetch data", async () => {
    const config = {
      ...configs["trader-joe-v2-on-chain-usdc"].EUROC,
      address: traderJoeV2Contract.address,
    };
    const fetcher = new TraderJoeV2OnChainFetcher(
      "trader-joe-v2-test-fetcher",
      { EUROC: config },
      provider
    );

    const result = await fetcher.fetchAll(["EUROC"]);
    expect(result).toEqual([{ symbol: "EUROC", value: 1.0757109115530015 }]);
  });
});
