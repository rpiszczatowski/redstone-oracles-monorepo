import {
  MockContract,
  MockProvider,
  deployMockContract,
  deployContract,
} from "ethereum-waffle";
import { TraderJoeV2OnChainFetcher } from "../../src/fetchers/evm-chain/avalanche/trader-joe-on-chain/trader-joe-v2/TraderJoeV2OnChainFetcher";
import pairAbi from "../../src/fetchers/evm-chain/avalanche/trader-joe-on-chain/trader-joe-v2/TraderJoeV2LBPair.abi.json";
import routerAbi from "../../src/fetchers/evm-chain/avalanche/trader-joe-on-chain/trader-joe-v2/TraderJoeV2LBRouter.abi.json";
import configs from "../../src/fetchers/evm-chain/avalanche/trader-joe-on-chain/trader-joe-v2/trader-joe-v2-on-chain-fetchers-configs.json";
import {
  clearLastPricesCache,
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import multicall3Json from "../abis/Multicall3.deployment.json";
import { Contract } from "ethers";
import { saveMockPriceInLocalDb } from "./_helpers";

const FETCHER_TO_TEST = "trader-joe-v2-avalanche-on-chain-usdc";
const TOKEN_TO_TEST = "EUROC";
const PAIRED_TOKEN = "USDC"

describe("Trader Joe - EUROC token", () => {
  let pairContract: MockContract;
  let routerContract: MockContract;
  let provider: MockProvider;
  let multicall: Contract;

  beforeAll(async () => {
    setupLocalDb();
    provider = new MockProvider();
    const [wallet] = provider.getWallets();

    pairContract = await deployMockContract(wallet, pairAbi, {
      address: configs[FETCHER_TO_TEST][TOKEN_TO_TEST].pairAddress,
    });
    routerContract = await deployMockContract(wallet, routerAbi.abi, {
      address: configs[FETCHER_TO_TEST][TOKEN_TO_TEST].routerAddress,
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

  test("Should properly fetch data, no slippage", async () => {
    await asAwaitable(pairContract.mock.getActiveId.returns("8388754"));
    await asAwaitable(pairContract.mock.getBinStep.returns("5"));
    // do price for TOKEN_TO_TEST available, so no slippage returned
    await saveMockPriceInLocalDb(1, PAIRED_TOKEN);

    const fetcher = new TraderJoeV2OnChainFetcher(
      "trader-joe-v2-test-fetcher",
      configs[FETCHER_TO_TEST],
      provider
    );
    fetcher.overrideMulticallAddress(multicall.address);

    const result = await fetcher.fetchAll([TOKEN_TO_TEST]);

    expect(result).toEqual([
      {
        symbol: TOKEN_TO_TEST,
        value: "1.075710911553001485",
        metadata: {
          slippage: []
        },
      },
    ]);
  });

  test("Should properly fetch data", async () => {
    await asAwaitable(pairContract.mock.getActiveId.returns("8388754"));
    await asAwaitable(pairContract.mock.getBinStep.returns("5"));
    await asAwaitable(
      routerContract.mock.getSwapOut
        .returns("0", "5000000000", "0") // buy
        .returns("0", "5000000000", "0")
    );
    await saveMockPriceInLocalDb(1, PAIRED_TOKEN);
    await saveMockPriceInLocalDb(1, TOKEN_TO_TEST);

    const fetcher = new TraderJoeV2OnChainFetcher(
      "trader-joe-v2-test-fetcher",
      configs[FETCHER_TO_TEST],
      provider
    );
    fetcher.overrideMulticallAddress(multicall.address);

    const result = await fetcher.fetchAll([TOKEN_TO_TEST]);

    expect(result).toEqual([
      {
        symbol: TOKEN_TO_TEST,
        value: "1.075710911553001485",
        metadata: {
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

