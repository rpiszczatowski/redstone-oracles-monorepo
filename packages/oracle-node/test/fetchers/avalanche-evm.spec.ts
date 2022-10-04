import axios from "axios";
import { Contract } from "ethers";
import { MockProvider, deployContract } from "ethereum-waffle";
import { AvalancheEvmFetcher } from "../../src/fetchers/evm-chain/AvalancheEvmFetcher";
import Multicall2 from "../../src/fetchers/evm-chain/contracts-details/common/Multicall2.json";
import { yieldYakContractDetails } from "../../src/fetchers/evm-chain/contracts-details/yield-yak";
import { lpTokensDetails } from "../../src/fetchers/evm-chain/contracts-details/lp-tokens";
import YYMock from "./mocks/YYMock.json";
import LPTokenMock from "./mocks/LPTokenMock.json";

jest.setTimeout(15000);

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

      yieldYakContractDetails.YYAV3SA1.abi = YYMock.abi;
      yieldYakContractDetails.YYAV3SA1.address = Yycontract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new AvalancheEvmFetcher(
        provider,
        multicallContract.address
      );

      mockedAxios.get.mockResolvedValueOnce({
        data: [{ value: 17 }],
      });
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

      yieldYakContractDetails.SAV2.abi = YYMock.abi;
      yieldYakContractDetails.SAV2.address = Yycontract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new AvalancheEvmFetcher(
        provider,
        multicallContract.address
      );

      mockedAxios.get.mockResolvedValueOnce({
        data: [{ value: 23 }],
      });
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

      lpTokensDetails.TJ_AVAX_USDC_LP.abi = LPTokenMock.abi;
      lpTokensDetails.TJ_AVAX_USDC_LP.address = lpTokenContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new AvalancheEvmFetcher(
        provider,
        multicallContract.address
      );

      mockedAxios.get.mockResolvedValue({
        data: [{ value: 17 }],
      });
      const result = await fetcher.fetchAll(["TJ_AVAX_USDC_LP"]);
      expect(result).toEqual([
        { symbol: "TJ_AVAX_USDC_LP", value: 98663550.92399499 },
      ]);
    });
  });
});
