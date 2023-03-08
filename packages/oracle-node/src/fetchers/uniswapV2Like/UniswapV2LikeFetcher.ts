import { BigNumber, providers, utils, Contract } from "ethers";
import {
  DexOnChainFetcher,
  Responses,
} from "../dex-on-chain/DexOnChainFetcher";
import { getLastPrice } from "../../db/local-db";
import abi from "./UniswapV2.abi.json";

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

export class UniswapV2LikeFetcher extends DexOnChainFetcher<Reserves> {
  protected retryForInvalidResponse: boolean = true;

  constructor(
    name: string,
    protected readonly poolsConfig: PoolsConfig,
    private readonly provider: providers.JsonRpcProvider
  ) {
    super(name);
  }

  override async makeRequest(spotAssetId: string): Promise<Reserves> {
    const uniswapV2Pair = new Contract(
      this.poolsConfig[spotAssetId].address,
      abi,
      this.provider
    );

    const { _reserve0, _reserve1 } = await uniswapV2Pair.getReserves();

    return {
      reserve0: _reserve0,
      reserve1: _reserve1,
    };
  }

  override calculateSpotPrice(assetId: string, response: Reserves): number {
    const {
      isSymbol0CurrentAsset,
      reserve0Serialized,
      reserve1Serialized,
      pairedTokenPrice,
    } = this.getParamsFromResponse(assetId, response);

    const balanceRatio = this.calculateBalanceRatio(
      isSymbol0CurrentAsset,
      reserve0Serialized,
      reserve1Serialized
    );

    const spotPrice = balanceRatio
      .mul(utils.parseUnits("1.0", DEFAULT_DECIMALS))
      .div(pairedTokenPrice);

    return parseFloat(utils.formatEther(spotPrice));
  }

  override calculateLiquidity(assetId: string, response: Reserves): number {
    const {
      isSymbol0CurrentAsset,
      reserve0Serialized,
      reserve1Serialized,
      pairedTokenPrice,
    } = this.getParamsFromResponse(assetId, response);

    const reserve = isSymbol0CurrentAsset
      ? reserve1Serialized
      : reserve0Serialized;

    const liquidityAsBigNumber = reserve
      .mul(pairedTokenPrice)
      .div(utils.parseUnits("1.0", DEFAULT_DECIMALS))
      .mul(BigNumber.from(2));

    return parseFloat(utils.formatEther(liquidityAsBigNumber));
  }

  getParamsFromResponse(assetId: string, response: Reserves) {
    const { reserve0, reserve1 } = response;
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

    const lastPriceFromCache = getLastPrice(pairedToken);
    if (!lastPriceFromCache) {
      throw new Error(`Cannot get last price from cache for: ${pairedToken}`);
    }
    const pairedTokenPriceAsBigNumber = utils.parseEther(
      lastPriceFromCache.value.toString()
    );

    return {
      reserve0Serialized,
      reserve1Serialized,
      isSymbol0CurrentAsset: symbol0 === assetId,
      pairedTokenPrice: pairedTokenPriceAsBigNumber,
    };
  }

  serializeReserveDecimals(reserve: BigNumber, decimals: number): BigNumber {
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
}
