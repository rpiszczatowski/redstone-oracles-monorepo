import { Contract } from "ethers";
import { MockProvider, deployContract } from "ethereum-waffle";
import { AvalancheEvmFetcher } from "../../src/fetchers/evm-chain/avalanche/AvalancheEvmFetcher";
import Multicall2 from "../../src/fetchers/evm-chain/avalanche/contracts-details/common/Multicall2.json";
import { yieldYakContractsDetails } from "../../src/fetchers/evm-chain/avalanche/contracts-details/yield-yak";
import { lpTokensContractsDetails } from "../../src/fetchers/evm-chain/avalanche/contracts-details/lp-tokens";
import { mooTokensContractsDetails } from "../../src/fetchers/evm-chain/avalanche/contracts-details/moo-joe";
import YYMock from "./mocks/YYMock.json";
import LPTokenMock from "./mocks/LPTokenMock.json";
import MooTokenMock from "./mocks/MooTokenMock.json";
import OracleAdaptersMock from "./mocks/OracleAdaptersMock.json";
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
      const Yycontract = await deployContract(wallet, {
        bytecode: YYMock.bytecode,
        abi: YYMock.abi,
      });

      multicallContract = await deployContract(wallet, {
        bytecode: Multicall2.bytecode,
        abi: Multicall2.abi,
      });

      yieldYakContractsDetails.YY_AAVE_AVAX.abi = YYMock.abi;
      yieldYakContractsDetails.YY_AAVE_AVAX.address = Yycontract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new AvalancheEvmFetcher(
        provider,
        multicallContract.address
      );

      await saveMockPriceInLocalDb(17, "AVAX");

      const result = await fetcher.fetchAll(["YY_AAVE_AVAX"]);
      expect(result).toEqual([{ symbol: "YY_AAVE_AVAX", value: 17.28590481 }]);
    });
  });

  describe("YY_PTP_sAVAX", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();
      const Yycontract = await deployContract(wallet, {
        bytecode: YYMock.bytecode,
        abi: YYMock.abi,
      });

      multicallContract = await deployContract(wallet, {
        bytecode: Multicall2.bytecode,
        abi: Multicall2.abi,
      });

      yieldYakContractsDetails.YY_PTP_sAVAX.abi = YYMock.abi;
      yieldYakContractsDetails.YY_PTP_sAVAX.address = Yycontract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new AvalancheEvmFetcher(
        provider,
        multicallContract.address
      );

      await saveMockPriceInLocalDb(23, "sAVAX");

      const result = await fetcher.fetchAll(["YY_PTP_sAVAX"]);
      expect(result).toEqual([{ symbol: "YY_PTP_sAVAX", value: 23.38681239 }]);
    });
  });

  describe("LP Token", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();
      const lpTokenContract = await deployContract(wallet, {
        bytecode: LPTokenMock.bytecode,
        abi: LPTokenMock.abi,
      });

      multicallContract = await deployContract(wallet, {
        bytecode: Multicall2.bytecode,
        abi: Multicall2.abi,
      });

      lpTokensContractsDetails.TJ_AVAX_USDC_LP.abi = LPTokenMock.abi;
      lpTokensContractsDetails.TJ_AVAX_USDC_LP.address =
        lpTokenContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new AvalancheEvmFetcher(
        provider,
        multicallContract.address
      );

      await saveMockPricesInLocalDb([17, 1], ["AVAX", "USDC"]);

      const result = await fetcher.fetchAll(["TJ_AVAX_USDC_LP"]);
      expect(result).toEqual([
        { symbol: "TJ_AVAX_USDC_LP", value: 10864910.562549423 },
      ]);
    });
  });

  describe("Moo Token", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();
      const mooTokenContract = await deployContract(wallet, {
        bytecode: MooTokenMock.bytecode,
        abi: MooTokenMock.abi,
      });

      multicallContract = await deployContract(wallet, {
        bytecode: Multicall2.bytecode,
        abi: Multicall2.abi,
      });

      mooTokensContractsDetails.MOO_TJ_AVAX_USDC_LP.abi = MooTokenMock.abi;
      mooTokensContractsDetails.MOO_TJ_AVAX_USDC_LP.address =
        mooTokenContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new AvalancheEvmFetcher(
        provider,
        multicallContract.address
      );

      await saveMockPriceInLocalDb(11232453.706920957, "TJ_AVAX_USDC_LP");

      const result = await fetcher.fetchAll(["MOO_TJ_AVAX_USDC_LP"]);
      expect(result).toEqual([
        { symbol: "MOO_TJ_AVAX_USDC_LP", value: 12566138.19921592 },
      ]);
    });
  });

  describe("Oracle Adapters Token", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();
      const oracleTokenContract = await deployContract(wallet, {
        bytecode: OracleAdaptersMock.bytecode,
        abi: OracleAdaptersMock.abi,
      });

      multicallContract = await deployContract(wallet, {
        bytecode: Multicall2.bytecode,
        abi: Multicall2.abi,
      });

      oracleAdaptersContractsDetails.sAVAX.abi = OracleAdaptersMock.abi;
      oracleAdaptersContractsDetails.sAVAX.address =
        oracleTokenContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new AvalancheEvmFetcher(
        provider,
        multicallContract.address
      );

      const result = await fetcher.fetchAll(["sAVAX"]);
      expect(result).toEqual([{ symbol: "sAVAX", value: 13.71346982 }]);
    });
  });
});
