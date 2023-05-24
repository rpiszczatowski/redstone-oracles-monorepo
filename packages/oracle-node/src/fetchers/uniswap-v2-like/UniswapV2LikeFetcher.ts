import { BigNumber, providers, Contract } from "ethers";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import { getLastPrice } from "../../db/local-db";
import abi from "./UniswapV2.abi.json";
import {
  bigNumberToFloat,
  decimalsMultiplier,
  normalizeDecimals,
} from "../../utils/big-numbers";

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
    private readonly provider: providers.Provider
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
      reserve0Normalized,
      reserve1Normalized,
      pairedTokenPrice,
    } = this.getParamsFromResponse(assetId, response);

    const balanceRatioBigNumber = isSymbol0CurrentAsset
      ? reserve1Normalized.mul(decimalsMultiplier).div(reserve0Normalized)
      : reserve0Normalized.mul(decimalsMultiplier).div(reserve1Normalized);

    return bigNumberToFloat(balanceRatioBigNumber) * pairedTokenPrice;
  }

  override calculateLiquidity(assetId: string, response: Reserves): number {
    const {
      isSymbol0CurrentAsset,
      reserve0Normalized,
      reserve1Normalized,
      pairedTokenPrice,
    } = this.getParamsFromResponse(assetId, response);

    const reserve = isSymbol0CurrentAsset
      ? reserve1Normalized
      : reserve0Normalized;

    return bigNumberToFloat(reserve) * 2 * pairedTokenPrice;
  }

  getParamsFromResponse(assetId: string, response: Reserves) {
    const { reserve0, reserve1 } = response;
    const { symbol0Decimals, symbol1Decimals, symbol0, pairedToken } =
      this.poolsConfig[assetId];

    const reserve0Normalized = normalizeDecimals(reserve0, symbol0Decimals);
    const reserve1Normalized = normalizeDecimals(reserve1, symbol1Decimals);

    const pairedTokenPrice = getLastPrice(pairedToken);
    if (!pairedTokenPrice) {
      throw new Error(`Cannot get last price from cache for: ${pairedToken}`);
    }

    return {
      reserve0Normalized,
      reserve1Normalized,
      pairedTokenPrice: pairedTokenPrice.value,
      isSymbol0CurrentAsset: symbol0 === assetId,
    };
  }
}
