import { Contract, Wallet } from "ethers";
import {
  MockContract,
  MockProvider,
  deployContract,
  deployMockContract,
} from "ethereum-waffle";
import { EvmFetcher } from "../../src/fetchers/evm-chain/shared/EvmFetcher";
import { requestHandlers } from "../../src/fetchers/evm-chain/ethereum/evm-fetcher/sources";
import Multicall2 from "../../src/fetchers/evm-chain/shared/abis/Multicall2.abi.json";
import { saveMockPriceInLocalDb } from "./_helpers";
import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import { balancerTokensContractDetails } from "../../src/fetchers/evm-chain/ethereum/evm-fetcher/sources/balancer/balancerTokensContractDetails";

jest.setTimeout(15000);

describe("Ethereum EVM fetcher", () => {
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
        { symbol: "BB-A-WETH", value: 1855.7836255384855 },
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
