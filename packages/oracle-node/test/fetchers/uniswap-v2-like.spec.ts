import { Contract } from "ethers";
import { MockProvider, deployContract } from "ethereum-waffle";
import { UniswapV2LikeFetcher } from "../../src/fetchers/uniswapV2Like/UniswapV2LikeFetcher";
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
          symbol1: "DAI",
          symbol1Decimals: 18,
          pairedToken: "DAI",
        },
      },
      provider
    );

    await saveMockPriceInLocalDb(1, "DAI");

    const result = await fetcher.fetchAll(["MockToken"]);
    expect(result).toEqual([
      { symbol: "MockToken", value: 14587.257085574453 },
    ]);
  });
});
