import { Contract } from "ethers";
import { MockProvider, deployContract } from "ethereum-waffle";
import { UniswapV2LikeFetcher } from "../../src/fetchers/uniswap-v2-like/UniswapV2LikeFetcher";
import UniswapV2Mock from "./mocks/UniswapV2Mock.json";
import { saveMockPriceInLocalDb } from "./_helpers";
import {
  clearPricesSublevel,
  closeLocalLevelDB,
  setupLocalDb,
} from "../../src/db/local-db";

describe("UniswapV2Like", () => {
  let uniswapV2LikeContract: Contract;
  let provider: MockProvider;

  beforeAll(async () => {
    setupLocalDb();
    provider = new MockProvider();
    const [wallet] = provider.getWallets();
    uniswapV2LikeContract = await deployContract(wallet, {
      bytecode: UniswapV2Mock.bytecode,
      abi: UniswapV2Mock.abi,
    });
  });

  beforeEach(async () => {
    await clearPricesSublevel();
  });

  afterAll(async () => {
    await closeLocalLevelDB();
  });

  test("Should properly fetch data", async () => {
    const fetcher = new UniswapV2LikeFetcher(
      "uniswap-v2-like-mock",
      {
        MockToken: {
          address: uniswapV2LikeContract.address,
          symbol0: "MockToken",
          symbol0Decimals: 9,
          symbol1: "Dai",
          symbol1Decimals: 18,
          pairedToken: "Dai",
        },
      },
      provider
    );

    await saveMockPriceInLocalDb(1, "Dai");

    const result = await fetcher.fetchAll([
      "MockToken",
      "MockToken_uniswap-v2-like-mock_liquidity",
    ]);

    expect(result).toEqual([
      { symbol: "MockToken", value: 10.439079904087286 },
      {
        symbol: "MockToken_uniswap-v2-like-mock_liquidity",
        value: 153215.79754985688,
      },
    ]);
  });
});
