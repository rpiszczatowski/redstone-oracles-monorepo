import { Contract } from "ethers";
import { MockProvider, deployMockContract } from "ethereum-waffle";
import { EvmFetcher } from "../../src/fetchers/evm-chain/shared/EvmFetcher";
import { requestHandlers } from "../../src/fetchers/evm-chain/arbitrum/evm-fetcher/sources";
import { deployMulticallContract, saveMockPriceInLocalDb } from "./_helpers";
import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";
import { beefyContractsDetails } from "../../src/fetchers/evm-chain/arbitrum/evm-fetcher/sources/beefy/beefyContractsDetails";
import BeefyVaultAbi from "../../src/fetchers/evm-chain/shared/abis/BeefyVault.abi.json";

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
      await beefyContract.mock.balance.returns("2488713301502775226721");
      await beefyContract.mock.totalSupply.returns("2373975350528778878698");

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
});
