import { Contract } from "ethers";
import { MockProvider, deployMockContract } from "ethereum-waffle";
import { EvmFetcher } from "../../src/fetchers/evm-chain/shared/EvmFetcher";
import { requestHandlers } from "../../src/fetchers/evm-chain/arbitrum/evm-fetcher/sources";
import {
  asAwaitable,
  deployMulticallContract,
  saveMockPriceInLocalDb,
  saveMockPricesInLocalDb,
} from "./_helpers";
import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import { beefyContractsDetails } from "../../src/fetchers/evm-chain/arbitrum/evm-fetcher/sources/beefy/beefyContractsDetails";
import BeefyVaultAbi from "../../src/fetchers/evm-chain/shared/abis/BeefyVault.abi.json";
import { yieldYakTokensContractsDetails } from "../../src/fetchers/evm-chain/arbitrum/evm-fetcher/sources/yield-yak/yieldYakTokensContractsDetails";
import YieldYakLPTokenAbi from "../../src/fetchers/evm-chain/shared/abis/YieldYakLPToken.abi.json";
import { dexLpTokensContractsDetails } from "../../src/fetchers/evm-chain/arbitrum/evm-fetcher/sources/dex-lp-tokens/dexLpTokensContractsDetails";
import DexLpTokenAbi from "../../src/fetchers/evm-chain/shared/abis/DexLpToken.abi.json";
import { levelFinanceContractDetails } from "../../src/fetchers/evm-chain/arbitrum/evm-fetcher/sources/level-finance/leveFinanceContractDetails";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LIQUIDITY_CALCULATOR_ADDRESS } from "../../src/fetchers/evm-chain/arbitrum/evm-fetcher/sources/level-finance/LevelFinanceTokensRequestHandlers";
import LevelFinanceLpTokenAbi from "../../src/fetchers/evm-chain/arbitrum/evm-fetcher/sources/level-finance/LevelFinanceLpToken.abi.json";
import LevelFinanceLiquidityCalculatorAbi from "../../src/fetchers/evm-chain/arbitrum/evm-fetcher/sources/level-finance/LevelFinanceLiquidityCalculator.abi.json";

jest.setTimeout(15000);

describe("Arbitrum EVM fetcher", () => {
  let provider: MockProvider;
  let multicallContract: Contract;

  beforeAll(() => {
    setupLocalDb();
  });

  beforeEach(async () => {
    await clearPricesSublevel();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  describe("Beefy vault - MOO_GMX", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();
      const beefyContract = await deployMockContract(wallet, BeefyVaultAbi);
      await asAwaitable(
        beefyContract.mock.balance.returns("2488713301502775226721")
      );
      await asAwaitable(
        beefyContract.mock.totalSupply.returns("2373975350528778878698")
      );

      multicallContract = await deployMulticallContract(wallet);

      beefyContractsDetails.MOO_GMX.address = beefyContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new EvmFetcher(
        "arbitrum-evm-test-fetcher",
        { mainProvider: provider },
        multicallContract.address,
        requestHandlers
      );

      await saveMockPriceInLocalDb(36.27, "GMX");

      const result = await fetcher.fetchAll(["MOO_GMX"]);
      expect(result).toEqual([{ symbol: "MOO_GMX", value: 38.02298596967315 }]);
    });
  });

  describe("YieldYak LP Token - YY_WOMBEX_USDT", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();
      const yieldYakContract = await deployMockContract(
        wallet,
        YieldYakLPTokenAbi
      );
      await asAwaitable(
        yieldYakContract.mock.totalDeposits.returns("400488970")
      );
      await asAwaitable(yieldYakContract.mock.totalSupply.returns("400000000"));

      multicallContract = await deployMulticallContract(wallet);

      yieldYakTokensContractsDetails.YY_WOMBEX_USDT.address =
        yieldYakContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new EvmFetcher(
        "arbitrum-evm-test-fetcher",
        { mainProvider: provider },
        multicallContract.address,
        requestHandlers
      );

      await saveMockPriceInLocalDb(0.99, "USDT");

      const result = await fetcher.fetchAll(["YY_WOMBEX_USDT"]);
      expect(result).toEqual([
        { symbol: "YY_WOMBEX_USDT", value: 0.99121020075 },
      ]);
    });
  });

  describe("DEX LP Token - SUSHI_DPX_ETH_LP", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();

      const dexLpTokenContract = await deployMockContract(
        wallet,
        DexLpTokenAbi
      );
      await asAwaitable(
        dexLpTokenContract.mock.getReserves.returns(
          "22695143440192357835227",
          "1047489210335175121050",
          1693378156
        )
      );
      await asAwaitable(
        dexLpTokenContract.mock.totalSupply.returns("4354205571809301622184")
      );

      multicallContract = await deployMulticallContract(wallet);

      dexLpTokensContractsDetails.SUSHI_DPX_ETH_LP.address =
        dexLpTokenContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new EvmFetcher(
        "arbitrum-evm-test-fetcher",
        { mainProvider: provider },
        multicallContract.address,
        requestHandlers
      );

      await saveMockPricesInLocalDb([79.61, 1720.62], ["DPX", "ETH"]);

      const result = await fetcher.fetchAll(["SUSHI_DPX_ETH_LP"]);
      expect(result).toEqual([
        { symbol: "SUSHI_DPX_ETH_LP", value: 828.874171569813 },
      ]);
    });
  });

  describe("Level finance - arbMzeLLP", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();

      const lpTokenContract = await deployMockContract(
        wallet,
        LevelFinanceLpTokenAbi
      );
      await asAwaitable(
        lpTokenContract.mock.totalSupply.returns("1138455647148900835319062")
      );

      const liquidityCalculatorContract = await deployMockContract(
        wallet,
        LevelFinanceLiquidityCalculatorAbi
      );
      await asAwaitable(
        liquidityCalculatorContract.mock.getTrancheValue.returns(
          "870471667555050807323983275164889675"
        )
      );

      multicallContract = await deployMulticallContract(wallet);

      levelFinanceContractDetails.arbMzeLLP.address = lpTokenContract.address;
      (LIQUIDITY_CALCULATOR_ADDRESS as unknown) =
        liquidityCalculatorContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new EvmFetcher(
        "arbitrum-evm-test-fetcher",
        { mainProvider: provider },
        multicallContract.address,
        requestHandlers
      );

      const result = await fetcher.fetchAll(["arbMzeLLP"]);
      expect(result).toEqual([
        { symbol: "arbMzeLLP", value: 0.7646074484632076 },
      ]);
    });
  });
});
