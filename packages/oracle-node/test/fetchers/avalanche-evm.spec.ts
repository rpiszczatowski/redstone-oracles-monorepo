import { BigNumber, Contract, Wallet } from "ethers";
import {
  MockContract,
  MockProvider,
  deployContract,
  deployMockContract,
} from "ethereum-waffle";
import { AvalancheEvmFetcher } from "../../src/fetchers/evm-chain/avalanche/AvalancheEvmFetcher";
import Multicall2 from "../../src/fetchers/evm-chain/shared/abis/Multicall2.abi.json";
import { yieldYakContractsDetails } from "../../src/fetchers/evm-chain/avalanche/contracts-details/yield-yak";
import { lpTokensContractsDetails } from "../../src/fetchers/evm-chain/avalanche/contracts-details/lp-tokens";
import { mooTokensContractsDetails } from "../../src/fetchers/evm-chain/avalanche/contracts-details/moo-joe";
import { saveMockPriceInLocalDb, saveMockPricesInLocalDb } from "./_helpers";
import { oracleAdaptersContractsDetails } from "../../src/fetchers/evm-chain/avalanche/contracts-details/oracle-adapters";
import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";

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
        yieldYakContractsDetails.YY_AAVE_AVAX.abi
      );
      await yycontract.mock.totalDeposits.returns("147818834870104122793011");
      await yycontract.mock.totalSupply.returns("141732077110706865863209");

      multicallContract = await deployMulticallContract(wallet);

      yieldYakContractsDetails.YY_AAVE_AVAX.address = yycontract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new AvalancheEvmFetcher(
        { avalancheProvider: provider },
        multicallContract.address
      );

      await saveMockPriceInLocalDb(17, "AVAX");

      const result = await fetcher.fetchAll(["YY_AAVE_AVAX"]);
      expect(result).toEqual([{ symbol: "YY_AAVE_AVAX", value: 17.73007384 }]);
    });
  });

  describe("YY_PTP_sAVAX", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();

      const yycontract = await deployMockContract(
        wallet,
        yieldYakContractsDetails.YY_PTP_sAVAX.abi
      );
      await yycontract.mock.totalDeposits.returns("24882891934878312264803");
      await yycontract.mock.totalSupply.returns("23574725205283071781434");

      multicallContract = await deployMulticallContract(wallet);

      yieldYakContractsDetails.YY_PTP_sAVAX.address = yycontract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new AvalancheEvmFetcher(
        { avalancheProvider: provider },
        multicallContract.address
      );

      await saveMockPriceInLocalDb(23, "sAVAX");

      const result = await fetcher.fetchAll(["YY_PTP_sAVAX"]);
      expect(result).toEqual([{ symbol: "YY_PTP_sAVAX", value: 24.27627506 }]);
    });
  });

  describe("LP Token", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();

      const lpTokenContract = await deployMockContract(
        wallet,
        lpTokensContractsDetails.TJ_AVAX_USDC_LP.abi
      );
      await lpTokenContract.mock.getReserves.returns(
        "116071821240319574811726",
        2399967450763,
        1681724100
      );
      await lpTokenContract.mock.totalSupply.returns("374628493439219919");

      multicallContract = await deployMulticallContract(wallet);

      lpTokensContractsDetails.TJ_AVAX_USDC_LP.address =
        lpTokenContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new AvalancheEvmFetcher(
        { avalancheProvider: provider },
        multicallContract.address
      );

      await saveMockPricesInLocalDb([17, 1], ["AVAX", "USDC"]);

      const result = await fetcher.fetchAll(["TJ_AVAX_USDC_LP"]);
      expect(result).toEqual([
        { symbol: "TJ_AVAX_USDC_LP", value: 11617688.448459277 },
      ]);
    });
  });

  describe("Moo Token", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();

      const mooTokenContract = await deployMockContract(
        wallet,
        mooTokensContractsDetails.MOO_TJ_AVAX_USDC_LP.abi
      );
      await mooTokenContract.mock.balance.returns("71564564588400204");
      await mooTokenContract.mock.totalSupply.returns("62713817908999769");

      multicallContract = await deployMulticallContract(wallet);

      mooTokensContractsDetails.MOO_TJ_AVAX_USDC_LP.address =
        mooTokenContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new AvalancheEvmFetcher(
        { avalancheProvider: provider },
        multicallContract.address
      );

      await saveMockPriceInLocalDb(11232453.706920957, "TJ_AVAX_USDC_LP");

      const result = await fetcher.fetchAll(["MOO_TJ_AVAX_USDC_LP"]);
      expect(result).toEqual([
        { symbol: "MOO_TJ_AVAX_USDC_LP", value: 12817680.126343986 },
      ]);
    });
  });

  describe("Oracle Adapters Token", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();

      const oracleTokenContract = await deployMockContract(
        wallet,
        oracleAdaptersContractsDetails.sAVAX.abi
      );
      await oracleTokenContract.mock.latestAnswer.returns("2221594395");

      multicallContract = await deployMulticallContract(wallet);

      oracleAdaptersContractsDetails.sAVAX.address =
        oracleTokenContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new AvalancheEvmFetcher(
        { avalancheProvider: provider },
        multicallContract.address
      );

      const result = await fetcher.fetchAll(["sAVAX"]);
      expect(result).toEqual([{ symbol: "sAVAX", value: 22.21594395 }]);
    });
  });

  test("Should use fallback if first provider failed", async () => {
    const fallbackProvider = new MockProvider();
    const [wallet] = fallbackProvider.getWallets();

    const oracleTokenContract = await deployMockContract(
      wallet,
      oracleAdaptersContractsDetails.sAVAX.abi
    );
    await oracleTokenContract.mock.latestAnswer.returns("2221594395");

    multicallContract = await deployMulticallContract(wallet);

    oracleAdaptersContractsDetails.sAVAX.address = oracleTokenContract.address;

    const fetcher = new AvalancheEvmFetcher(
      { avalancheProvider: {} as any, fallbackProvider },
      multicallContract.address
    );

    const result = await fetcher.fetchAll(["sAVAX"]);
    expect(result).toEqual([{ symbol: "sAVAX", value: 22.21594395 }]);
  });
});

async function deployMulticallContract(wallet: Wallet) {
  return await deployContract(wallet, {
    bytecode: Multicall2.bytecode,
    abi: Multicall2.abi,
  });
}
