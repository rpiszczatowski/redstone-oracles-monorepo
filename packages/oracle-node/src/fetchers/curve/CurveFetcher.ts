import { Decimal } from "decimal.js";
import { BigNumberish, Contract } from "ethers";
import { RedstoneCommon, RedstoneTypes } from "redstone-utils";
import { getRawPrice, getRawPriceOrFail } from "../../db/local-db";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import {
  calculateSlippage,
  convertUsdToTokenAmount,
  DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE,
} from "../SlippageAndLiquidityCommons";
import { PoolsConfig } from "./curve-fetchers-config";
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

  override async makeRequest(
    assetId: string,
    blockTag?: string | number
  ): Promise<CurveFetcherResponse> {
    const { address, provider, pairedToken, pairedTokenDecimalsMultiplier } =
      this.poolsConfig[assetId];

    const curvePool = new Contract(address, abi, provider);

    const amountInBaseToken = this.getAmountInBaseToken(assetId);
    const amountInPairedToken = convertUsdToTokenAmount(
      pairedToken,
      pairedTokenDecimalsMultiplier,
      DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE
    );

    const multicallHandler = new MultiCallHandler(
      this.poolsConfig[assetId],
      assetId,
      amountInPairedToken,
      amountInBaseToken
    );

    const multicallResponse = (await RedstoneCommon.multiCallOneContract(
      curvePool,
      multicallHandler.buildRequest(),
      blockTag?.toString()
    )) as BigNumberish[];

    return multicallHandler.parseResponse(multicallResponse);
  }

  override calculateLiquidity(
    assetId: string,
    response: CurveFetcherResponse
  ): string | undefined {
    const baseTokenPrice = getRawPrice(assetId);
    if (!baseTokenPrice) {
      return undefined;
    }
    const pairedTokenPrice = this.getPairedTokenPrice(assetId);

    const baseTokenLiquidity = new Decimal(
      response.baseTokenSupply.toString()
    ).mul(baseTokenPrice.value);
    const pairedTokenLiquidity = new Decimal(
      response.pairedTokenSupply.toString()
    ).mul(pairedTokenPrice);

    return baseTokenLiquidity.add(pairedTokenLiquidity).toString();
  }

  override calculateSlippage(
    _assetId: string,
    response: CurveFetcherResponse
  ): RedstoneTypes.SlippageData[] {
    if (!response.bigBuyRatio || !response.bigSellRatio) {
      return [];
    }
    const smallSell = response.sellRatio;
    const smallBuy = new Decimal(1).div(response.sellRatio);

    const buySlippage = calculateSlippage(smallBuy, response.bigBuyRatio);
    const sellSlippage = calculateSlippage(smallSell, response.bigSellRatio);

    return [
      {
        slippageAsPercent: buySlippage.toString(),
        direction: "buy",
        simulationValueInUsd: DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE.toString(),
      },
      {
        slippageAsPercent: sellSlippage.toString(),
        direction: "sell",
        simulationValueInUsd: DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE.toString(),
      },
    ];
  }

  override calculateSpotPrice(
    assetId: string,
    response: CurveFetcherResponse
  ): number {
    return this.calculateSpotPriceUsingRatio(assetId, response.sellRatio);
  }

  private getAmountInBaseToken(assetId: string) {
    const { tokenDecimalsMultiplier: tokenDecimals } =
      this.poolsConfig[assetId];
    try {
      return convertUsdToTokenAmount(
        assetId,
        tokenDecimals,
        DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE
      );
    } catch (e) {
      return undefined;
    }
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

  parseResponse(multicallResponse: BigNumberish[]): CurveFetcherResponse {
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
      sellRatio:
        RedstoneCommon.bignumberishToDecimal(ratioBigNumber).div(
          pairedTokenDecimals
        ),
      baseTokenSupply:
        RedstoneCommon.bignumberishToDecimal(baseTokenSupply).div(
          tokenDecimals
        ),
      pairedTokenSupply:
        RedstoneCommon.bignumberishToDecimal(pairedTokenSupply).div(
          pairedTokenDecimals
        ),
      assetId: this.assetId,
    };
    const decimalsRatio = tokenDecimals / pairedTokenDecimals;

    if (this.amountInBaseToken) {
      const [bigSell, bigBuy] = slippageResponses;
      const slippageParsedResponse = {
        bigBuyRatio: RedstoneCommon.bignumberishToDecimal(bigBuy)
          .div(decimalsRatio)
          .div(this.amountInPairedToken),
        bigSellRatio: RedstoneCommon.bignumberishToDecimal(bigSell)
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
