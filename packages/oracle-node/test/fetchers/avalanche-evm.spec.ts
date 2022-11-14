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
import { mockRedstoneApiPrice, mockRedstoneApiPrices } from "./_helpers";

jest.setTimeout(15000);

describe("Avalanche EVM fetcher", () => {
  let provider: MockProvider;
  let multicallContract: Contract;

  describe("YYAV3SA1", () => {
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

      yieldYakContractsDetails.YYAV3SA1.abi = YYMock.abi;
      yieldYakContractsDetails.YYAV3SA1.address = Yycontract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new AvalancheEvmFetcher(
        provider,
        multicallContract.address
      );

      mockRedstoneApiPrice(17, "AVAX");

      const result = await fetcher.fetchAll(["YYAV3SA1"]);
      expect(result).toEqual([{ symbol: "YYAV3SA1", value: 17.28590481 }]);
    });
  });

  describe("SAV2", () => {
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

      yieldYakContractsDetails.SAV2.abi = YYMock.abi;
      yieldYakContractsDetails.SAV2.address = Yycontract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new AvalancheEvmFetcher(
        provider,
        multicallContract.address
      );

      mockRedstoneApiPrice(23, "SAV2");

      const result = await fetcher.fetchAll(["SAV2"]);
      expect(result).toEqual([{ symbol: "SAV2", value: 23.38681239 }]);
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

      lpTokensContractsDetails.TJ_WAVAX_USDC_LP.abi = LPTokenMock.abi;
      lpTokensContractsDetails.TJ_WAVAX_USDC_LP.address =
        lpTokenContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new AvalancheEvmFetcher(
        provider,
        multicallContract.address
      );

      mockRedstoneApiPrices([17, 1], ["AVAX", "USDC"]);

      const result = await fetcher.fetchAll(["TJ_WAVAX_USDC_LP"]);
      expect(result).toEqual([
        { symbol: "TJ_WAVAX_USDC_LP", value: 10864910.562549423 },
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

      mooTokensContractsDetails.MOO_TJ_WAVAX_USDC_LP.abi = MooTokenMock.abi;
      mooTokensContractsDetails.MOO_TJ_WAVAX_USDC_LP.address =
        mooTokenContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new AvalancheEvmFetcher(
        provider,
        multicallContract.address
      );

      mockRedstoneApiPrice(11232453.706920957, "TJ_WAVAX_USDC_LP");

      const result = await fetcher.fetchAll(["MOO_TJ_WAVAX_USDC_LP"]);
      expect(result).toEqual([
        { symbol: "MOO_TJ_WAVAX_USDC_LP", value: 12566138.19921592 },
      ]);
    });
  });
});
