import { Decimal } from "decimal.js";
import { BigNumber, Contract } from "ethers";
import { getRawPrice } from "../../db/local-db";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import abi from "./CurveFactory.abi.json";
import { PoolsConfig } from "./curve-fetchers-config";

/**
 * as default value we should use 10 ** 18 this the PRECISION on Curve StableSwap contract
 * if we provide value lower then 10 ** 18 we start loosing PRECISION
 * if we provide value bigger then 10 ** 18  for example 100 * 10**18 we are saying how much 100 x  pairedTokenIndex i wil receive for tokenIndex
 * thus there is higher chance that slippage will occur and will affect price
 * same in examples https://curve.readthedocs.io/factory-pools.html#StableSwap.get_dy and on Curve frontend
 * in case of LPs (with big volume) it shouldn't be a problem, however this just not correct
 */
const CURVE_PRECISION_DECIMAL = new Decimal("10").toPower(18);

export interface CurveFetcherResponse {
  ratio: Decimal;
  assetId: string;
}

export class CurveFetcher extends DexOnChainFetcher<CurveFetcherResponse> {
  protected retryForInvalidResponse: boolean = true;

  constructor(name: string, public readonly poolsConfig: PoolsConfig) {
    super(name);
  }

  async makeRequest(
    assetId: string,
    blockTag?: string | number
  ): Promise<CurveFetcherResponse> {
    const {
      address,
      provider,
      ratioMultiplier,
      functionName,
      tokenIndex,
      pairedTokenIndex,
    } = this.poolsConfig[assetId];

    const curveFactory = new Contract(address, abi, provider);

    const ratioBigNumber = (await curveFactory[functionName](
      tokenIndex,
      pairedTokenIndex,
      CURVE_PRECISION_DECIMAL.toString(),
      { blockTag }
    )) as BigNumber;

    const precisionDivider = CURVE_PRECISION_DECIMAL.div(ratioMultiplier);
    const ratioFloat = new Decimal(ratioBigNumber.toString()).div(
      precisionDivider
    );

    return {
      ratio: ratioFloat,
      assetId,
    };
  }

  calculateSpotPrice(assetId: string, response: CurveFetcherResponse): number {
    const pairedTokenPrice = new Decimal(this.getPairedTokenPrice(assetId));
    const ratio = response.ratio;

    return ratio.mul(pairedTokenPrice).toNumber();
  }

  getPairedTokenPrice(assetId: string): string {
    const { pairedToken } = this.poolsConfig[assetId];

    const lastPriceFromCache = getRawPrice(pairedToken);
    if (!lastPriceFromCache) {
      throw new Error(`Cannot get last price from cache for: ${pairedToken}`);
    }

    return lastPriceFromCache.value;
  }
}
