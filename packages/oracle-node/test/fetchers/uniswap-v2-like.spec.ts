import { Contract } from "ethers";
import { MockProvider, deployMockContract } from "ethereum-waffle";
import { UniswapV2LikeFetcher } from "../../src/fetchers/uniswap-v2-like/UniswapV2LikeFetcher";
import abi from "../../src/fetchers/uniswap-v2-like/UniswapV2.abi.json";
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
    uniswapV2LikeContract = await deployMockContract(wallet, abi);
    await uniswapV2LikeContract.mock.getReserves.returns(
      "37240658972367",
      "17968718500361203250875",
      1681731755
    );
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
        USDC: {
          address: uniswapV2LikeContract.address,
          symbol0: "USDC",
          symbol0Decimals: 6,
          symbol1: "WETH",
          symbol1Decimals: 18,
          pairedToken: "ETH",
        },
      },
      provider
    );

    await saveMockPriceInLocalDb(2085.39, "ETH");
    await saveMockPriceInLocalDb(1.0062063053522414, "USDC");

    const result = await fetcher.fetchAll([
      "USDC",
      "USDC_uniswap-v2-like-mock_liquidity",
    ]);

    expect(result).toEqual([
      {
        symbol: "USDC",
        value: "1.0062063053522427861",
        metadata: {
          liquidity: "74943571.746936499295",
          slippage: [
            {
              direction: "buy",
              simulationValueInUsd: "10000",
              slippageAsPercent: "0.021120342609802036234",
            },
            {
              direction: "sell",
              simulationValueInUsd: "10000",
              slippageAsPercent: "0.026684059117760280233",
            },
          ],
        },
      },
      {
        symbol: "USDC_uniswap-v2-like-mock_liquidity",
        value: "74943571.746936499295",
      },
    ]);
  });
});
