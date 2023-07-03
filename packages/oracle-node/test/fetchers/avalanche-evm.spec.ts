import { Contract, Wallet } from "ethers";
import {
  MockContract,
  MockProvider,
  deployContract,
  deployMockContract,
} from "ethereum-waffle";
import { EvmFetcher } from "../../src/fetchers/evm-chain/shared/EvmFetcher";
import { requestHandlers } from "../../src/fetchers/evm-chain/avalanche/evm-fetcher/sources";
import Multicall2 from "../../src/fetchers/evm-chain/shared/abis/Multicall2.abi.json";
import { saveMockPriceInLocalDb, saveMockPricesInLocalDb } from "./_helpers";
import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import { yieldYakTokensContractsDetails } from "../../src/fetchers/evm-chain/avalanche/evm-fetcher/sources/yield-yak/yieldYakTokensContractsDetails";
import { dexLpTokensContractsDetails } from "../../src/fetchers/evm-chain/avalanche/evm-fetcher/sources/dex-lp-tokens/dexLpTokensContractsDetails";
import { mooTraderJoeTokensContractsDetails } from "../../src/fetchers/evm-chain/avalanche/evm-fetcher/sources/moo-trader-joe/mooTraderJoeTokensContractsDetails";
import { glpManagerContractsDetails } from "../../src/fetchers/evm-chain/avalanche/evm-fetcher/sources/glp-manager/glpManagerContractsDetails";
import { oracleAdapterContractsDetails } from "../../src/fetchers/evm-chain/avalanche/evm-fetcher/sources/oracle-adapter/oracleAdapterContractsDetails";
import { gmdTokensContractsDetails } from "../../src/fetchers/evm-chain/avalanche/evm-fetcher/sources/gmd/gmdTokensContractsDetails";
import GmdVaultAbi from "../../src/fetchers/evm-chain/avalanche/evm-fetcher/sources/gmd/GmdVault.abi.json";
import { traderJoeAutoPoolTokenContractDetails } from "../../src/fetchers/evm-chain/avalanche/evm-fetcher/sources/trader-joe-auto/traderJoeAutoPoolTokenContractsDetails";
import { steakHutTokensContractDetails } from "../../src/fetchers/evm-chain/avalanche/evm-fetcher/sources/steak-hut/steakHutTokensContractDetails";
import { curveTokensContractsDetails } from "../../src/fetchers/evm-chain/avalanche/evm-fetcher/sources/curve-lp-tokens/curveTokensContractsDetails";

jest.setTimeout(15000);

describe("Avalanche EVM fetcher", () => {
  let provider: MockProvider;
  let multicallContract: Contract;
  let yycontract: MockContract;

  beforeAll(() => {
    setupLocalDb();
  });

  beforeEach(async () => {
    await clearPricesSublevel();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  describe("YY_AAVE_AVAX", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();

      yycontract = await deployMockContract(
        wallet,
        yieldYakTokensContractsDetails.YY_AAVE_AVAX.abi
      );
      await yycontract.mock.totalDeposits.returns("147818834870104122793011");
      await yycontract.mock.totalSupply.returns("141732077110706865863209");

      multicallContract = await deployMulticallContract(wallet);

      yieldYakTokensContractsDetails.YY_AAVE_AVAX.address = yycontract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new EvmFetcher(
        "avalanche-evm-test-fetcher",
        { mainProvider: provider },
        multicallContract.address,
        requestHandlers
      );

      await saveMockPriceInLocalDb(17, "AVAX");

      const result = await fetcher.fetchAll(["YY_AAVE_AVAX"]);
      expect(result).toEqual([
        { symbol: "YY_AAVE_AVAX", value: 17.730073840863344 },
      ]);
    });
  });

  describe("YY_PTP_sAVAX", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();

      const yycontract = await deployMockContract(
        wallet,
        yieldYakTokensContractsDetails.YY_PTP_sAVAX.abi
      );
      await yycontract.mock.totalDeposits.returns("24882891934878312264803");
      await yycontract.mock.totalSupply.returns("23574725205283071781434");

      multicallContract = await deployMulticallContract(wallet);

      yieldYakTokensContractsDetails.YY_PTP_sAVAX.address = yycontract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new EvmFetcher(
        "avalanche-evm-test-fetcher",
        { mainProvider: provider },
        multicallContract.address,
        requestHandlers
      );

      await saveMockPriceInLocalDb(23, "sAVAX");

      const result = await fetcher.fetchAll(["YY_PTP_sAVAX"]);
      expect(result).toEqual([
        { symbol: "YY_PTP_sAVAX", value: 24.27627510050246 },
      ]);
    });
  });

  describe("DEX LP Token - TJ_AVAX_USDC_LP", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();

      const dexLpTokenContract = await deployMockContract(
        wallet,
        dexLpTokensContractsDetails.TJ_AVAX_USDC_LP.abi
      );
      await dexLpTokenContract.mock.getReserves.returns(
        "116071821240319574811726",
        2399967450763,
        1681724100
      );
      await dexLpTokenContract.mock.totalSupply.returns("374628493439219919");

      multicallContract = await deployMulticallContract(wallet);

      dexLpTokensContractsDetails.TJ_AVAX_USDC_LP.address =
        dexLpTokenContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new EvmFetcher(
        "avalanche-evm-test-fetcher",
        { mainProvider: provider },
        multicallContract.address,
        requestHandlers
      );

      await saveMockPricesInLocalDb([17, 1], ["AVAX", "USDC"]);

      const result = await fetcher.fetchAll(["TJ_AVAX_USDC_LP"]);
      expect(result).toEqual([
        { symbol: "TJ_AVAX_USDC_LP", value: 11617688.448459277 },
      ]);
    });
  });

  describe("DEX LP Token - TJ_AVAX_BTC_LP", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();

      const dexLpTokenContract = await deployMockContract(
        wallet,
        dexLpTokensContractsDetails.TJ_AVAX_BTC_LP.abi
      );
      await dexLpTokenContract.mock.getReserves.returns(
        1830801156,
        "33041173352087533019593",
        1683827563
      );
      await dexLpTokenContract.mock.totalSupply.returns("7434434708217657");

      multicallContract = await deployMulticallContract(wallet);

      dexLpTokensContractsDetails.TJ_AVAX_BTC_LP.address =
        dexLpTokenContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new EvmFetcher(
        "avalanche-evm-test-fetcher",
        { mainProvider: provider },
        multicallContract.address,
        requestHandlers
      );

      await saveMockPricesInLocalDb([14.89, 26844.66], ["AVAX", "BTC"]);

      const result = await fetcher.fetchAll(["TJ_AVAX_BTC_LP"]);
      expect(result).toEqual([
        { symbol: "TJ_AVAX_BTC_LP", value: 132283801.36493877 },
      ]);
    });
  });

  describe("Moo Trader Joe Token", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();

      const mooTokenContract = await deployMockContract(
        wallet,
        mooTraderJoeTokensContractsDetails.MOO_TJ_AVAX_USDC_LP.abi
      );
      await mooTokenContract.mock.balance.returns("71564564588400204");
      await mooTokenContract.mock.totalSupply.returns("62713817908999769");

      multicallContract = await deployMulticallContract(wallet);

      mooTraderJoeTokensContractsDetails.MOO_TJ_AVAX_USDC_LP.address =
        mooTokenContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new EvmFetcher(
        "avalanche-evm-test-fetcher",
        { mainProvider: provider },
        multicallContract.address,
        requestHandlers
      );

      await saveMockPriceInLocalDb(11232453.706920957, "TJ_AVAX_USDC_LP");

      const result = await fetcher.fetchAll(["MOO_TJ_AVAX_USDC_LP"]);
      expect(result).toEqual([
        { symbol: "MOO_TJ_AVAX_USDC_LP", value: 12817680.147644207 },
      ]);
    });
  });

  describe("Oracle Adapters Token", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();

      const oracleTokenContract = await deployMockContract(
        wallet,
        oracleAdapterContractsDetails.sAVAX.abi
      );
      await oracleTokenContract.mock.latestAnswer.returns("2221594395");

      multicallContract = await deployMulticallContract(wallet);

      oracleAdapterContractsDetails.sAVAX.address = oracleTokenContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new EvmFetcher(
        "avalanche-evm-test-fetcher",
        { mainProvider: provider },
        multicallContract.address,
        requestHandlers
      );
      const result = await fetcher.fetchAll(["sAVAX"]);
      expect(result).toEqual([{ symbol: "sAVAX", value: 22.21594395 }]);
    });
  });

  describe("Glp Manager Token", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();

      const glpManagerContract = await deployMockContract(
        wallet,
        glpManagerContractsDetails.GLP.abi
      );
      await glpManagerContract.mock.getPrice.returns(
        "770441001309746795129889619853"
      );

      multicallContract = await deployMulticallContract(wallet);

      glpManagerContractsDetails.GLP.address = glpManagerContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new EvmFetcher(
        "avalanche-evm-test-fetcher",
        { mainProvider: provider },
        multicallContract.address,
        requestHandlers
      );

      const result = await fetcher.fetchAll(["GLP"]);
      expect(result).toEqual([{ symbol: "GLP", value: 0.7704410013097468 }]);
    });
  });

  describe("Steak Hut LB Vault Token", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();

      const steakHutVaultContract = await deployMockContract(
        wallet,
        steakHutTokensContractDetails["SHLB_BTC.b-AVAX_B"].abi
      );
      await steakHutVaultContract.mock.getUnderlyingAssets.returns(
        "10661",
        "1894861017009646333"
      );
      await steakHutVaultContract.mock.totalSupply.returns(
        "373022375711998840044"
      );
      multicallContract = await deployMulticallContract(wallet);

      steakHutTokensContractDetails["SHLB_BTC.b-AVAX_B"].address =
        steakHutVaultContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new EvmFetcher(
        "avalanche-evm-test-fetcher",
        { mainProvider: provider },
        multicallContract.address,
        requestHandlers
      );

      await saveMockPricesInLocalDb([26371.56, 15.11], ["BTC", "AVAX"]);

      const result = await fetcher.fetchAll(["SHLB_BTC.b-AVAX_B"]);
      expect(result).toEqual([
        { symbol: "SHLB_BTC.b-AVAX_B", value: 31.442821978615758 },
      ]);
    });
  });

  describe("GMD Token", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();
      const gmdTokenContract = await deployMockContract(
        wallet,
        gmdTokensContractsDetails.abi
      );
      await gmdTokenContract.mock.totalSupply.returns(
        "13893284805458516865839"
      );
      const gmdVaultContract = await deployMockContract(wallet, GmdVaultAbi);
      await gmdVaultContract.mock.poolInfo.returns(
        "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
        gmdTokenContract.address,
        "57529812360454",
        "14514081300794260141483",
        "1683032305",
        "15500000000000000000000",
        "500",
        "1250",
        true,
        true,
        true
      );

      multicallContract = await deployMulticallContract(wallet);

      gmdTokensContractsDetails.contractDetails.gmdAVAX.address =
        gmdTokenContract.address;
      gmdTokensContractsDetails.vaultAddress = gmdVaultContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new EvmFetcher(
        "avalanche-evm-test-fetcher",
        { mainProvider: provider },
        multicallContract.address,
        requestHandlers
      );

      await saveMockPriceInLocalDb(16.64, "AVAX");

      const result = await fetcher.fetchAll(["gmdAVAX"]);
      expect(result).toEqual([
        { symbol: "gmdAVAX", value: 17.383528533894893 },
      ]);
    });
  });

  describe("Trader Joe Auto - TJ_AVAX_USDC_AUTO", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();
      const traderJoeAutoContract = await deployMockContract(
        wallet,
        traderJoeAutoPoolTokenContractDetails.TJ_AVAX_USDC_AUTO.abi
      );
      await traderJoeAutoContract.mock.getBalances.returns(
        "74327537225082812589017",
        "288750527247"
      );
      await traderJoeAutoContract.mock.totalSupply.returns(
        "1460320130438534473"
      );
      await traderJoeAutoContract.mock.decimals.returns(12);
      multicallContract = await deployMulticallContract(wallet);

      traderJoeAutoPoolTokenContractDetails.TJ_AVAX_USDC_AUTO.address =
        traderJoeAutoContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new EvmFetcher(
        "avalanche-evm-test-fetcher",
        { mainProvider: provider },
        multicallContract.address,
        requestHandlers
      );

      await saveMockPricesInLocalDb([11.65, 1], ["AVAX", "USDC"]);

      const result = await fetcher.fetchAll(["TJ_AVAX_USDC_AUTO"]);
      expect(result).toEqual([
        { symbol: "TJ_AVAX_USDC_AUTO", value: 0.7906939799374457 },
      ]);
    });
  });

  describe("Curve Token - crvUSDBTCETH", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();

      const erc20Contract = await deployMockContract(
        wallet,
        curveTokensContractsDetails.erc20abi
      );
      await erc20Contract.mock.totalSupply.returns("2932165587542432290261");

      const poolContract = await deployMockContract(
        wallet,
        curveTokensContractsDetails.abi
      );
      await poolContract.mock.balances
        .withArgs("0")
        .returns("1119820024147240997756265");
      await poolContract.mock.balances.withArgs("1").returns("3891897421");
      await poolContract.mock.balances
        .withArgs("2")
        .returns("633420213309859800953");

      multicallContract = await deployMulticallContract(wallet);

      const tokensAddresses = {
        erc20Address: erc20Contract.address,
        poolAddress: poolContract.address,
      };

      curveTokensContractsDetails.crvUSDBTCETH = {
        ...curveTokensContractsDetails.crvUSDBTCETH,
        ...tokensAddresses,
      };
    });

    test("Should properly fetch data", async () => {
      const fetcher = new EvmFetcher(
        "avalanche-evm-test-fetcher",
        { mainProvider: provider },
        multicallContract.address,
        requestHandlers
      );

      await saveMockPricesInLocalDb(
        [30173.88, 1855.19, 0.677235],
        ["BTC", "ETH", "CRV"]
      );

      const result = await fetcher.fetchAll(["crvUSDBTCETH"]);
      expect(result).toEqual([
        { symbol: "crvUSDBTCETH", value: 1059.910337370855 },
      ]);
    });
  });
});

async function deployMulticallContract(wallet: Wallet) {
  return await deployContract(wallet, {
    bytecode: Multicall2.bytecode,
    abi: Multicall2.abi,
  });
}
