import { Contract, Wallet } from "ethers";
import {
  MockProvider,
  deployContract,
  deployMockContract,
} from "ethereum-waffle";
import { EvmFetcher } from "../../src/fetchers/evm-chain/shared/EvmFetcher";
import { requestHandlers } from "../../src/fetchers/evm-chain/ethereum/evm-fetcher/sources";
import Multicall2 from "../../src/fetchers/evm-chain/shared/abis/Multicall2.abi.json";
import { saveMockPriceInLocalDb, saveMockPricesInLocalDb } from "./_helpers";
import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import { balancerTokensContractDetails } from "../../src/fetchers/evm-chain/ethereum/evm-fetcher/sources/balancer/balancerTokensContractDetails";
import { curveTokensContractsDetails } from "../../src/fetchers/evm-chain/ethereum/evm-fetcher/sources/curve-lp-tokens/curveTokensContractsDetails";

jest.setTimeout(15000);

describe("Ethereum EVM fetcher", () => {
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

  describe("Balancer Token - BB-A-WETH", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();
      const balancerPoolContract = await deployMockContract(
        wallet,
        balancerTokensContractDetails["BB-A-WETH"].abi
      );
      await balancerPoolContract.mock.getVirtualSupply.returns(
        "3475875376494986673998"
      );
      await balancerPoolContract.mock.getWrappedTokenRate.returns(
        "1003719018416122994"
      );

      const balancerVaultContract = await deployMockContract(
        wallet,
        balancerTokensContractDetails["BB-A-WETH"].vaultAbi
      );
      await balancerVaultContract.mock.getPoolTokens.returns(
        [
          "0x60D604890feaa0b5460B28A424407c24fe89374a",
          "0x59463BB67dDD04fe58ED291ba36C26d99A39fbc6",
          "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        ],
        [
          "5192296858531351753154001342546097",
          "3309105565121848877500",
          "161677223664873474049",
        ],
        "17442976"
      );

      multicallContract = await deployMulticallContract(wallet);

      balancerTokensContractDetails["BB-A-WETH"].address =
        balancerPoolContract.address;
      balancerTokensContractDetails["BB-A-WETH"].vaultAddress =
        balancerVaultContract.address;
    });

    test("Should properly fetch data", async () => {
      const fetcher = new EvmFetcher(
        "ethereum-evm-test-fetcher",
        { mainProvider: provider },
        multicallContract.address,
        requestHandlers
      );

      await saveMockPriceInLocalDb(1850.13, "ETH");

      const result = await fetcher.fetchAll(["BB-A-WETH"]);
      expect(result).toEqual([
        { symbol: "BB-A-WETH", value: 1853.9698689576974 },
      ]);
    });
  });

  describe("Curve Token - crvFRAX", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();

      const erc20Contract = await deployMockContract(
        wallet,
        curveTokensContractsDetails.erc20abi
      );
      await erc20Contract.mock.totalSupply.returns(
        "317026235670089709931993389"
      );
      const poolContract = await deployMockContract(
        wallet,
        curveTokensContractsDetails.abi
      );
      await poolContract.mock.balances
        .withArgs(0)
        .returns("112592607687628212016974636");
      await poolContract.mock.balances.withArgs(1).returns("106490055087428");
      await poolContract.mock.balances.withArgs(2).returns("106266964025858");

      multicallContract = await deployMulticallContract(wallet);

      const tokensAddresses = {
        erc20Address: erc20Contract.address,
        poolAddress: poolContract.address,
      };

      curveTokensContractsDetails["3Crv"] = {
        ...curveTokensContractsDetails["3Crv"],
        ...tokensAddresses,
      };
    });

    test("Should properly fetch data", async () => {
      const fetcher = new EvmFetcher(
        "ethereum-evm-test-fetcher",
        { mainProvider: provider },
        multicallContract.address,
        requestHandlers
      );

      await saveMockPricesInLocalDb([1.0, 1.0, 1.0], ["DAI", "USDC", "USDT"]);

      const result = await fetcher.fetchAll(["3Crv"]);
      expect(result).toEqual([{ symbol: "3Crv", value: 1.0262545814646273 }]);
    });
  });
});

async function deployMulticallContract(wallet: Wallet) {
  return await deployContract(wallet, {
    bytecode: Multicall2.bytecode,
    abi: Multicall2.abi,
  });
}
