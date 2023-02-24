import { BaseFetcher } from "../BaseFetcher";
import { BigNumber, providers, utils, Contract } from "ethers";
import { getLastPrice } from "../../db/local-db";
import abi from "./UniswapV2.abi.json";
import { config } from "../../config";
import { PricesObj } from "../../types";
import { addLiquidityIfNecessary, isLiquidity } from "../liquidity/utils";

const DEFAULT_DECIMALS = 18;

export interface PoolsConfig {
  [symbol: string]: {
    address: string;
    symbol0: string;
    symbol0Decimals: number;
    symbol1: string;
    symbol1Decimals: number;
    pairedToken: string;
  };
}

interface Reserves {
  reserve0: BigNumber;
  reserve1: BigNumber;
}

interface FetchResponse {
  [id: string]: Reserves;
}

const provider = new providers.JsonRpcProvider(config.ethMainRpcUrl);

export class UniswapV2LikeFetcher extends BaseFetcher {
  protected retryForInvalidResponse: boolean = true;
  private assetsWithoutLiquidity: string[] = [];

  constructor(name: string, private readonly poolsConfig: PoolsConfig) {
    super(name);
  }

  async fetchData(assetsIds: string[]): Promise<FetchResponse> {
    this.assetsWithoutLiquidity = assetsIds.filter(
      (assetId) => !isLiquidity(assetId)
    );
    const responses: FetchResponse = {};
    const promises = this.assetsWithoutLiquidity.map(async (assetId) => {
      const sushiswapV2Pair = new Contract(
        this.poolsConfig[assetId].address,
        abi,
        provider
      );
      const answer = await sushiswapV2Pair.getReserves();
      const { _reserve0, _reserve1 } = answer;

      responses[assetId] = {
        reserve0: _reserve0,
        reserve1: _reserve1,
      };
    });
    await Promise.allSettled(promises);
    return responses;
  }

  validateResponse(response: FetchResponse): boolean {
    return response !== undefined;
  }

  extractPrices(response: FetchResponse, assetsIds: string[]): PricesObj {
    const pricesObj: PricesObj = {};

    for (const assetId of this.assetsWithoutLiquidity) {
      const { reserve0, reserve1 } = response[assetId];
      const { symbol0Decimals, symbol1Decimals, symbol0, pairedToken } =
        this.poolsConfig[assetId];

      const reserve0Serialized = this.serializeReserveDecimals(
        reserve0,
        symbol0Decimals
      );

      const reserve1Serialized = this.serializeReserveDecimals(
        reserve1,
        symbol1Decimals
      );

      const pairedTokenPrice = getLastPrice(pairedToken);
      if (!pairedTokenPrice) {
        throw new Error(`Cannot get last price from cache for: ${pairedToken}`);
      }

      const isSymbol0CurrentAsset = symbol0 === assetId;
      const balanceRatio = this.calculateBalanceRatio(
        isSymbol0CurrentAsset,
        reserve0Serialized,
        reserve1Serialized
      );

      const pairedTokenPriceAsBigNumber = utils.parseEther(
        pairedTokenPrice.value.toString()
      );

      const spotPrice = this.calculateSpotPrice(
        balanceRatio,
        pairedTokenPriceAsBigNumber
      );
      pricesObj[assetId] = parseFloat(utils.formatEther(spotPrice));

      const liquidity = this.calculateLiquidity(
        isSymbol0CurrentAsset ? reserve1Serialized : reserve0Serialized,
        pairedTokenPriceAsBigNumber
      );
      addLiquidityIfNecessary(
        assetId,
        assetsIds,
        this.name,
        liquidity,
        pricesObj
      );
    }

    return pricesObj;
  }

  serializeReserveDecimals(reserve: BigNumber, decimals: number) {
    const decimalsRequired = DEFAULT_DECIMALS - decimals;
    return reserve.mul(utils.parseUnits("1.0", decimalsRequired));
  }

  calculateBalanceRatio(
    isSymbol0Asset: boolean,
    reserve0Serialized: BigNumber,
    reserve1Serialized: BigNumber
  ) {
    return isSymbol0Asset
      ? reserve1Serialized
          .mul(utils.parseUnits("1.0", DEFAULT_DECIMALS))
          .div(reserve0Serialized)
      : reserve0Serialized
          .mul(utils.parseUnits("1.0", DEFAULT_DECIMALS))
          .div(reserve1Serialized);
  }

  calculateSpotPrice(balanceRatio: BigNumber, pairedTokenPrice: BigNumber) {
    return balanceRatio
      .mul(utils.parseUnits("1.0", DEFAULT_DECIMALS))
      .div(pairedTokenPrice);
  }

  calculateLiquidity(reserve: BigNumber, pairedTokenPrice: BigNumber) {
    const liquidityAsBigNumber = reserve
      .mul(pairedTokenPrice)
      .div(utils.parseUnits("1.0", DEFAULT_DECIMALS))
      .mul(BigNumber.from(2));

    return parseFloat(utils.formatEther(liquidityAsBigNumber));
  }
}
