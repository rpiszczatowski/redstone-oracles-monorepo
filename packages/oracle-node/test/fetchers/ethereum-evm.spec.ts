import { Contract } from "ethers";
import { MockProvider, deployMockContract } from "ethereum-waffle";
import { EvmFetcher } from "../../src/fetchers/evm-chain/shared/EvmFetcher";
import { requestHandlers } from "../../src/fetchers/evm-chain/ethereum/evm-fetcher/sources";
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
import { curveTokensContractsDetails } from "../../src/fetchers/evm-chain/ethereum/evm-fetcher/sources/curve-lp-tokens/curveTokensContractsDetails";
import { lidoTokensContractDetails } from "../../src/fetchers/evm-chain/ethereum/evm-fetcher/sources/lido/lidoTokensContractDetails";

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

  describe("Curve Token - crvFRAX", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();

      const erc20Contract = await deployMockContract(
        wallet,
        curveTokensContractsDetails.erc20abi
      );
      await asAwaitable(
        erc20Contract.mock.totalSupply.returns("317026235670089709931993389")
      );
      const poolContract = await deployMockContract(
        wallet,
        curveTokensContractsDetails.abi
      );
      await asAwaitable(
        poolContract.mock.balances
          .withArgs(0)
          .returns("112592607687628212016974636")
      );
      await asAwaitable(
        poolContract.mock.balances.withArgs(1).returns("106490055087428")
      );
      await asAwaitable(
        poolContract.mock.balances.withArgs(2).returns("106266964025858")
      );

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

  describe("Lido Token - wstETH", () => {
    beforeAll(async () => {
      provider = new MockProvider();
      const [wallet] = provider.getWallets();

      const wstethContract = await deployMockContract(
        wallet,
        lidoTokensContractDetails.wstETH_FUNDAMENTAL.abi
      );
      await asAwaitable(
        wstethContract.mock.stEthPerToken.returns("1136995300838313055")
      );
      await asAwaitable(wstethContract.mock.decimals.returns(18));

      multicallContract = await deployMulticallContract(wallet);

      lidoTokensContractDetails.wstETH_FUNDAMENTAL = {
        ...lidoTokensContractDetails.wstETH_FUNDAMENTAL,
        address: wstethContract.address,
      };
    });

    test("Should properly fetch data", async () => {
      const fetcher = new EvmFetcher(
        "ethereum-evm-test-fetcher",
        { mainProvider: provider },
        multicallContract.address,
        requestHandlers
      );

      await saveMockPriceInLocalDb(1635.15, "STETH");

      const result = await fetcher.fetchAll(["wstETH_FUNDAMENTAL"]);
      expect(result).toEqual([
        { symbol: "wstETH_FUNDAMENTAL", value: 1859.1578661657677 },
      ]);
    });
  });
});
