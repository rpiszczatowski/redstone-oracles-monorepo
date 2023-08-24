import { Decimal } from "decimal.js";
import {
  CallReturnContext,
  ContractCallContext,
  ContractCallResults,
  Multicall,
} from "ethereum-multicall";
import { BigNumber, ethers, providers } from "ethers";
import { RedstoneTypes } from "redstone-utils";
import { getLastPrice } from "../../db/local-db";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import { TEN_AS_BASE_OF_POWER } from "../evm-chain/shared/contants";
import {
  Abis,
  FunctionNames,
  MulticallParams,
  MulticallResult,
  PoolConfig,
  PoolsConfig,
  QuoterInSingleParams,
  QuoterOutSingleParams,
  SlippageParams,
  TokenConfig,
} from "./types";

export type PriceAction = "buy" | "sell";

export class UniswapV3LikeFetcher extends DexOnChainFetcher<MulticallResult> {
  constructor(
    name: string,
    private readonly poolsConfig: PoolsConfig,
    private readonly provider: providers.Provider,
    private readonly abis: Abis,
    private readonly functionNames: FunctionNames
  ) {
    super(name);
  }

  async makeRequest(assetId: string): Promise<MulticallResult | null> {
    const multicallParams = this.prepareMulticallParams(assetId);
    const multicallContext = this.buildContractCallContext(
      assetId,
      multicallParams
    );
    const multicallResult = await this.createMulticallInstance().call(
      multicallContext
    );
    const poolConfig = this.poolsConfig[assetId];

    return {
      priceRatio: UniswapV3LikeFetcher.extractPriceRatio(
        multicallResult,
        poolConfig
      ),
      slippage: UniswapV3LikeFetcher.extractSlippage(multicallResult),
      pairedToken: UniswapV3LikeFetcher.getPairedTokenSymbol(
        assetId,
        poolConfig
      ),
    };
  }

  override calculateSpotPrice(
    assetId: string,
    multicallResult: MulticallResult
  ) {
    const otherAssetLastPrice = UniswapV3LikeFetcher.getLastPriceOrThrow(
      multicallResult.pairedToken
    );
    const isSymbol1Current = this.poolsConfig[assetId].token1Symbol === assetId;
    const priceMultiplier = isSymbol1Current
      ? 1.0 / multicallResult.priceRatio
      : multicallResult.priceRatio;
    return otherAssetLastPrice * priceMultiplier;
  }

  override calculateSlippage(
    assetId: string,
    response: MulticallResult
  ): RedstoneTypes.SlippageData[] {
    if (!this.poolsConfig[assetId].slippage) {
      throw new Error(
        `Slippage is not configured for fetcher ${this.getName()} assetId: ${assetId} in pool config`
      );
    }
    const slippageResponse: RedstoneTypes.SlippageData[] = [];
    for (const slippageInfo of this.poolsConfig[assetId].slippage!) {
      const slippageLabel = UniswapV3LikeFetcher.createSlippageLabel(
        slippageInfo.simulationValueInUsd,
        slippageInfo.direction
      );
      const slippageAsPercent = response.slippage[slippageLabel].toString();
      slippageResponse.push({
        direction: slippageInfo.direction,
        simulationValueInUsd: slippageInfo.simulationValueInUsd.toString(),
        slippageAsPercent,
      });
    }
    return slippageResponse;
  }

  private static convertDollars2Tokens(
    amountInDollars: number,
    tokenPrice: number,
    tokenDecimals: number
  ): string {
    return ethers.utils
      .parseUnits(
        (amountInDollars / tokenPrice).toFixed(tokenDecimals),
        tokenDecimals
      )
      .toString();
  }

  private prepareMulticallParams(assetId: string): MulticallParams {
    const poolConfig = this.poolsConfig[assetId];

    const pairedTokenPrice = getLastPrice(
      UniswapV3LikeFetcher.getPairedTokenSymbol(assetId, poolConfig)
    );
    const slippageParams: SlippageParams = {};

    if (pairedTokenPrice && poolConfig.slippage) {
      const currentToken = UniswapV3LikeFetcher.getCurrentTokenConfig(
        assetId,
        poolConfig
      );
      const quoteToken = UniswapV3LikeFetcher.getQuoteTokenConfig(
        assetId,
        poolConfig
      );
      for (const slippageInfo of poolConfig.slippage) {
        const swapAmount = UniswapV3LikeFetcher.convertDollars2Tokens(
          slippageInfo.simulationValueInUsd,
          pairedTokenPrice.value,
          quoteToken.decimals
        );
        const { buySlippageParams, sellSlippageParams } =
          UniswapV3LikeFetcher.createQuoterSingleParam(
            quoteToken,
            currentToken,
            poolConfig,
            swapAmount
          );
        slippageParams[
          UniswapV3LikeFetcher.createSlippageLabel(
            slippageInfo.simulationValueInUsd,
            "buy"
          )
        ] = buySlippageParams;
        slippageParams[
          UniswapV3LikeFetcher.createSlippageLabel(
            slippageInfo.simulationValueInUsd,
            "sell"
          )
        ] = sellSlippageParams;
      }
    }
    return {
      slippageParams,
    };
  }

  private static createQuoterSingleParam(
    quoteToken: TokenConfig,
    currentToken: TokenConfig,
    poolConfig: PoolConfig,
    swapAmount: string
  ): {
    buySlippageParams: QuoterInSingleParams;
    sellSlippageParams: QuoterOutSingleParams;
  } {
    const buySlippageParams = {
      tokenIn: quoteToken.address,
      tokenOut: currentToken.address,
      fee: poolConfig.fee,
      amountIn: swapAmount,
      sqrtPriceLimitX96: 0,
    };
    const sellSlippageParams = {
      tokenOut: quoteToken.address,
      tokenIn: currentToken.address,
      fee: poolConfig.fee,
      amountOut: swapAmount,
      sqrtPriceLimitX96: 0,
    };
    return { buySlippageParams, sellSlippageParams };
  }

  private static getTokenConfig(
    assetId: string,
    poolConfig: PoolConfig,
    current: boolean
  ): TokenConfig {
    const isSymbol1Current = poolConfig.token1Symbol === assetId;
    return current === isSymbol1Current
      ? {
          symbol: poolConfig.token1Symbol,
          address: poolConfig.token1Address,
          decimals: poolConfig.token1Decimals,
        }
      : {
          symbol: poolConfig.token0Symbol,
          address: poolConfig.token0Address,
          decimals: poolConfig.token0Decimals,
        };
  }

  private static getCurrentTokenConfig(
    assetId: string,
    poolConfig: PoolConfig
  ) {
    return this.getTokenConfig(assetId, poolConfig, true);
  }

  private static getQuoteTokenConfig(assetId: string, poolConfig: PoolConfig) {
    return this.getTokenConfig(assetId, poolConfig, false);
  }

  private static getPairedTokenSymbol(assetId: string, poolConfig: PoolConfig) {
    return poolConfig.pairedToken
      ? poolConfig.pairedToken
      : this.getQuoteTokenConfig(assetId, poolConfig).symbol;
  }

  private static createSlippageLabel(
    slippageAmount: number,
    priceAction: PriceAction
  ) {
    return `${slippageAmount}_${priceAction}`;
  }

  private static extractSlippageLabel(reference: string) {
    const regex = /^([^_]+)_([^_]+)$/;
    const regexResult = regex.exec(reference)!;
    return {
      slippageAmount: regexResult[1],
      priceAction: regexResult[2] as PriceAction,
    };
  }

  private static decimal(bigNumberLike: any): Decimal {
    return new Decimal(BigNumber.from(bigNumberLike).toString());
  }

  private static sqrtPriceX96ToPrice(uniswapV3SqrtPriceX96: Decimal): Decimal {
    // prices returned by uniswap v3 are square rooted and shifted by 96 bits to the left
    const priceShift = new Decimal(2).toPower(2 * 96);
    return uniswapV3SqrtPriceX96.toPower(2).div(priceShift);
  }

  private static getPriceBeforeSwap(
    multicallResult: ContractCallResults
  ): Decimal {
    const sqrtPriceX96BeforeSwap = this.decimal(
      multicallResult.results.poolContract.callsReturnContext[0].returnValues[0]
    );
    return this.sqrtPriceX96ToPrice(sqrtPriceX96BeforeSwap);
  }

  private static getPriceAfterSwap(
    callReturnContext: CallReturnContext
  ): Decimal {
    const sqrtPriceX96AfterSwap = this.decimal(
      callReturnContext.returnValues[1]
    );
    return this.sqrtPriceX96ToPrice(sqrtPriceX96AfterSwap);
  }

  private static extractSlippage(multicallResult: ContractCallResults) {
    const slippage: Record<string, number> = {};
    if (!multicallResult.results.quoterContract) {
      return slippage;
    }
    if (!multicallResult.results.poolContract.callsReturnContext[0].success) {
      throw new Error(
        `method 'slot0' failed, result ${JSON.stringify(
          multicallResult.results.poolContract.callsReturnContext[0]
        )}`
      );
    }
    const priceBeforeSwap = this.getPriceBeforeSwap(multicallResult);
    for (const callReturnContext of multicallResult.results.quoterContract.callsReturnContext.filter(
      (c) => c.success
    )) {
      const priceAfterSwap = this.getPriceAfterSwap(callReturnContext);

      slippage[callReturnContext.reference] = Number(
        priceAfterSwap
          .sub(priceBeforeSwap)
          .div(priceBeforeSwap)
          .abs()
          .toFixed(10)
      );
    }
    return slippage;
  }

  private static extractPriceRatio(
    multicallResult: ContractCallResults,
    poolConfig: PoolConfig
  ) {
    const price = this.getPriceBeforeSwap(multicallResult);
    const decimalsDifferenceMultiplier = new Decimal(
      TEN_AS_BASE_OF_POWER
    ).toPower(poolConfig.token0Decimals - poolConfig.token1Decimals);
    const priceRatio = price.times(decimalsDifferenceMultiplier).toNumber();

    return priceRatio; // as defined by uniswap v3 protocol (i.e. token1_amount/token0_amount)
  }

  private static getLastPriceOrThrow(outAssetId: string) {
    const lastPrice = getLastPrice(outAssetId);
    if (lastPrice === undefined) {
      throw new Error(`Could not fetch last price for ${outAssetId} from DB`);
    }
    return lastPrice.value;
  }

  private createMulticallInstance() {
    return new Multicall({
      ethersProvider: this.provider,
      tryAggregate: true,
    });
  }

  private buildContractCallContext(
    assetId: string,
    multicallParams: MulticallParams
  ): ContractCallContext[] {
    const res: ContractCallContext[] = [
      {
        reference: "poolContract",
        contractAddress: this.poolsConfig[assetId].poolAddress,
        abi: this.abis.poolAbi,
        calls: [
          {
            reference: "slot0Call",
            methodName: this.functionNames.slot0FunctionName,
            methodParameters: [],
          },
        ],
      },
    ];
    const quoterCalls = [];
    for (const slippageLabel in multicallParams.slippageParams) {
      const { priceAction } =
        UniswapV3LikeFetcher.extractSlippageLabel(slippageLabel);
      quoterCalls.push({
        reference: slippageLabel,
        methodName:
          priceAction === "buy"
            ? this.functionNames.buyFunctionName
            : this.functionNames.sellFunctionName,
        methodParameters: [multicallParams.slippageParams[slippageLabel]],
      });
    }
    if (quoterCalls.length > 0) {
      const slippageParams = {
        reference: "quoterContract",
        contractAddress: this.poolsConfig[assetId].quoterAddress,
        abi: this.abis.quoterAbi,
        calls: quoterCalls,
      };
      res.push(slippageParams);
    }
    return res;
  }
}
