import { Decimal } from "decimal.js";
import { BigNumber, Contract } from "ethers";
import { RedstoneCommon, RedstoneTypes } from "redstone-utils";
import { getRawPriceOrFail } from "../../db/local-db";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import { CURVE_SLIPPAGE_PARAMS, PoolsConfig } from "./curve-fetchers-config";
import abi from "./CurveFactory.abi.json";

const ONE_AS_DECIMAL = new Decimal("1");

export interface CurveFetcherResponse {
  sellRatio: Decimal;
  assetId: string;
  baseTokenSupply: Decimal;
  pairedTokenSupply: Decimal;
  bigBuyRatio?: Decimal;
  bigSellRatio?: Decimal;
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
      pairedToken,
      pairedTokenDecimalsMultiplier: pairedTokenDecimals,
    } = this.poolsConfig[assetId];

    const curvePool = new Contract(address, abi, provider);

    const amountInBaseToken = await this.getAmountInBaseToken(assetId);

    const amountInPairedToken = this.convertUsdToTokenAmount(
      pairedToken,
      pairedTokenDecimals
    );

    const multicallHandler = new MultiCallHandler(
      this.poolsConfig[assetId],
      assetId,
      amountInPairedToken,
      amountInBaseToken
    );

    const multicallResponse = await RedstoneCommon.multiCallOneContract(
      curvePool,
      multicallHandler.buildRequest(),
      blockTag?.toString()
    );

    return multicallHandler.parseResponse(multicallResponse);
  }

  calculateLiquidity(assetId: string, response: CurveFetcherResponse): string {
    const baseTokenPrice = this.calculateSpotPrice(assetId, response);
    const pairedTokenPrice = this.getPairedTokenPrice(assetId);

    const baseTokenLiquidity = new Decimal(
      response.baseTokenSupply.toString()
    ).mul(baseTokenPrice);
    const pairedTokenLiquidity = new Decimal(
      response.pairedTokenSupply.toString()
    ).mul(pairedTokenPrice);

    return baseTokenLiquidity.add(pairedTokenLiquidity).toString();
  }

  calculateSlippage(
    _assetId: string,
    response: CurveFetcherResponse
  ): RedstoneTypes.SlippageData[] {
    if (!response.bigBuyRatio || !response.bigSellRatio) {
      return [];
    }
    const smallSell = response.sellRatio;
    const smallBuy = new Decimal(1).div(response.sellRatio);

    const buySlippage = smallBuy
      .sub(response.bigBuyRatio)
      .abs()
      .div(smallBuy)
      .mul(100);
    const sellSlippage = smallSell
      .sub(response.bigSellRatio)
      .abs()
      .div(smallSell)
      .mul(100);

    return [
      {
        slippageAsPercent: buySlippage.toString(),
        direction: "buy",
        simulationValueInUsd: CURVE_SLIPPAGE_PARAMS.amountInUsd.toString(),
      },
      {
        slippageAsPercent: sellSlippage.toString(),
        direction: "sell",
        simulationValueInUsd: CURVE_SLIPPAGE_PARAMS.amountInUsd.toString(),
      },
    ];
  }

  calculateSpotPrice(assetId: string, response: CurveFetcherResponse): number {
    return this.calculateSpotPriceUsingRatio(assetId, response.sellRatio);
  }

  private async getAmountInBaseToken(assetId: string) {
    const { tokenDecimalsMultiplier: tokenDecimals } =
      this.poolsConfig[assetId];
    try {
      return this.convertUsdToTokenAmount(assetId, tokenDecimals);
      // if this is first iteration of fetcher we won't have assetId price in DB yet, thus we have to fetch it additionally
    } catch (e) {
      return undefined;
    }
  }

  private convertUsdToTokenAmount(assetId: string, decimals: number): string {
    return new Decimal(CURVE_SLIPPAGE_PARAMS.amountInUsd)
      .div(getRawPriceOrFail(assetId).value)
      .mul(decimals)
      .round()
      .toString();
  }

  private calculateSpotPriceUsingRatio(
    assetId: string,
    ratio: CurveFetcherResponse["sellRatio"]
  ): number {
    const pairedTokenPrice = new Decimal(this.getPairedTokenPrice(assetId));
    const fee = this.poolsConfig[assetId].fee;
    const ratioWithFee = ratio.div(ONE_AS_DECIMAL.minus(fee));
    return ratioWithFee.mul(pairedTokenPrice).toNumber();
  }

  private getPairedTokenPrice(assetId: string): string {
    const { pairedToken } = this.poolsConfig[assetId];
    const lastPriceFromCache = getRawPriceOrFail(pairedToken);
    return lastPriceFromCache.value;
  }
}

class MultiCallHandler {
  constructor(
    private readonly poolConfig: PoolsConfig[string],
    private readonly assetId: string,
    private readonly amountInPairedToken: string,
    private readonly amountInBaseToken: string | undefined
  ) {}

  buildRequest() {
    const {
      functionName,
      tokenIndex,
      pairedTokenIndex,
      tokenDecimalsMultiplier: tokenDecimals,
    } = this.poolConfig;
    const commonRequest = [
      {
        function: functionName,
        params: [tokenIndex, pairedTokenIndex, tokenDecimals.toString()],
      },
      {
        function: "balances",
        params: [tokenIndex],
      },
      {
        function: "balances",
        params: [pairedTokenIndex],
      },
    ];

    if (this.amountInBaseToken) {
      commonRequest.push(
        {
          function: functionName,
          params: [tokenIndex, pairedTokenIndex, this.amountInBaseToken],
        },
        {
          function: functionName,
          params: [pairedTokenIndex, tokenIndex, this.amountInPairedToken],
        }
      );
    }

    return commonRequest;
  }

  parseResponse(multicallResponse: BigNumber[]): CurveFetcherResponse {
    const {
      pairedTokenDecimalsMultiplier: pairedTokenDecimals,
      tokenDecimalsMultiplier: tokenDecimals,
    } = this.poolConfig;
    const [
      ratioBigNumber,
      baseTokenSupply,
      pairedTokenSupply,
      ...slippageResponses
    ] = multicallResponse;

    const commonParsedResult = {
      sellRatio: new Decimal(ratioBigNumber.toString()).div(
        pairedTokenDecimals
      ),
      baseTokenSupply: new Decimal(baseTokenSupply.toString()).div(
        tokenDecimals
      ),
      pairedTokenSupply: new Decimal(pairedTokenSupply.toString()).div(
        pairedTokenDecimals
      ),
      assetId: this.assetId,
    };
    const decimalsRatio = tokenDecimals / pairedTokenDecimals;

    if (this.amountInBaseToken) {
      const [bigSell, bigBuy] = slippageResponses;
      const slippageParsedResponse = {
        bigBuyRatio: new Decimal(bigBuy.toString())
          .div(decimalsRatio)
          .div(this.amountInPairedToken),
        bigSellRatio: new Decimal(bigSell.toString())
          .mul(decimalsRatio)
          .div(this.amountInBaseToken),
      };
      return {
        ...commonParsedResult,
        ...slippageParsedResponse,
      };
    }

    return commonParsedResult;
  }
}
