import { DexOnChainFetcher } from "../../../dex-on-chain/DexOnChainFetcher";
import { ethers } from "ethers";
import { BigNumber, providers } from "ethers";
import abi from "./abi.json";
import { getLastPrice } from "../../../../db/local-db";
import {
  MulticallParams,
  MulticallResult,
  PoolConfig,
  PoolsConfig,
  SlippageParams,
  TokenConfig,
} from "./types";
import {
  Multicall,
  ContractCallContext,
  ContractCallResults,
  CallReturnContext,
} from "ethereum-multicall";
import { Decimal } from "decimal.js";
import { TEN_AS_BASE_OF_POWER } from "../../shared/contants";
import { parseSlippageDataFeedId } from "../../../liquidity/utils";

type PriceAction = "buy" | "sell";
export class VelodromeOnChainFetcher extends DexOnChainFetcher<MulticallResult> {
  constructor(
    name: string,
    private readonly poolsConfig: PoolsConfig,
    private readonly provider: providers.Provider
  ) {
    super(name);
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

  private prepareSlippageParams(
    slippageParams: SlippageParams,
    slippageAmount: number,
    tokenPrice: number,
    tokenConfig: TokenConfig,
    action: PriceAction
  ) {
    const swapAmount = VelodromeOnChainFetcher.convertDollars2Tokens(
      slippageAmount,
      tokenPrice,
      tokenConfig.decimals
    );
    const slippageLabel = VelodromeOnChainFetcher.createSlippageLabel(
      slippageAmount,
      action
    );
    slippageParams[slippageLabel] = {
      tokenIn: tokenConfig.address,
      amountIn: swapAmount,
    };
  }

  private prepareMulticallParams(assetId: string): MulticallParams {
    const poolConfig = this.poolsConfig[assetId];

    const pairedTokenPrice = getLastPrice(
      VelodromeOnChainFetcher.getPairedTokenSymbol(assetId, poolConfig)
    );
    const currentTokenPrice = getLastPrice(assetId);
    const slippageParams: SlippageParams = {};

    if (pairedTokenPrice && poolConfig.slippage) {
      const currentToken = VelodromeOnChainFetcher.getCurrentTokenConfig(
        assetId,
        poolConfig
      );
      const quoteToken = VelodromeOnChainFetcher.getQuoteTokenConfig(
        assetId,
        poolConfig
      );
      for (const slippageAmount of poolConfig.slippage) {
        this.prepareSlippageParams(
          slippageParams,
          slippageAmount,
          pairedTokenPrice.value,
          quoteToken,
          "buy"
        );
        if (currentTokenPrice) {
          this.prepareSlippageParams(
            slippageParams,
            slippageAmount,
            currentTokenPrice.value,
            currentToken,
            "sell"
          );
        }
      }
    }
    return {
      slippageParams,
    };
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

  override async makeRequest(assetId: string): Promise<MulticallResult | null> {
    const multicallParams = this.prepareMulticallParams(assetId);
    const multicallContext = this.buildContractCallContext(
      assetId,
      multicallParams
    );
    const multicallResult = await this.createMulticallInstance().call(
      multicallContext
    );
    const poolConfig = this.poolsConfig[assetId];

    const priceRatio = VelodromeOnChainFetcher.extractPriceRatioFromResult(
      multicallResult,
      poolConfig
    ).toNumber();
    const slippage = VelodromeOnChainFetcher.extractSlippage(
      multicallResult,
      poolConfig
    );
    const pairedToken = VelodromeOnChainFetcher.getPairedTokenSymbol(
      assetId,
      poolConfig
    );
    return { priceRatio, slippage, pairedToken };
  }

  private static decimal(bigNumberLike: any): Decimal {
    return new Decimal(BigNumber.from(bigNumberLike).toString());
  }

  private static getPriceAfterSwap(
    getReservesContext: CallReturnContext,
    swapContext: CallReturnContext,
    poolConfig: PoolConfig
  ): Decimal {
    let reserve0BeforeSwap = this.decimal(getReservesContext.returnValues[0]);
    let reserve1BeforeSwap = this.decimal(getReservesContext.returnValues[1]);
    let reserve0AfterSwap = reserve0BeforeSwap;
    let reserve1AfterSwap = reserve1BeforeSwap;
    const wasToken0Swapped =
      swapContext.methodParameters[1] === poolConfig.token0Address;
    if (wasToken0Swapped) {
      reserve0AfterSwap = reserve0AfterSwap.plus(
        swapContext.methodParameters[0]
      );
      reserve1AfterSwap = reserve1AfterSwap.minus(
        this.decimal(swapContext.returnValues[0])
      );
    } else {
      reserve0AfterSwap = reserve0AfterSwap.minus(
        this.decimal(swapContext.returnValues[0])
      );
      reserve1AfterSwap = reserve1AfterSwap.plus(
        swapContext.methodParameters[0]
      );
    }
    return this.getPriceRatio(reserve0AfterSwap, reserve1AfterSwap, poolConfig);
  }

  private static successfulSlippageResults(
    multicallResult: ContractCallResults
  ) {
    return multicallResult.results.poolContract.callsReturnContext
      .slice(1) // the first one contains 'reserves' call result
      .filter((c) => c.success);
  }

  private static extractSlippage(
    multicallResult: ContractCallResults,
    poolConfig: PoolConfig
  ) {
    const slippage: Record<string, number> = {};
    const reservesResult = this.extractReservesResult(multicallResult);
    const priceBeforeSwap = this.extractPriceRatioFromResult(
      multicallResult,
      poolConfig
    );
    for (const callReturnContext of this.successfulSlippageResults(
      multicallResult
    )) {
      const priceAfterSwap = this.getPriceAfterSwap(
        reservesResult,
        callReturnContext,
        poolConfig
      );

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

  private static extractReservesResult(multicallResult: ContractCallResults) {
    const reservesResult =
      multicallResult.results.poolContract.callsReturnContext[0];
    if (!reservesResult.success) {
      throw new Error(
        `method 'getReserves' failed, result ${JSON.stringify(reservesResult)}`
      );
    }
    return reservesResult;
  }

  // https://docs.velodrome.finance/liquidity#stable-pools
  private static reservesToPriceForStablePool(
    reserve0: Decimal,
    reserve1: Decimal
  ): Decimal {
    const nom = reserve1.pow(3).plus(reserve1.mul(reserve0.pow(2)).mul(3));
    const den = reserve0.pow(3).plus(reserve0.mul(reserve1.pow(2)).mul(3));
    return nom.div(den);
  }

  private static reservesToPriceForVolatilePool(
    reserve0: Decimal,
    reserve1: Decimal
  ): Decimal {
    return reserve1.div(reserve0);
  }

  private static reservesToPrice(
    reserve0: Decimal,
    reserve1: Decimal,
    poolConfig: PoolConfig
  ) {
    if (poolConfig.stable) {
      return this.reservesToPriceForStablePool(reserve0, reserve1);
    } else {
      return this.reservesToPriceForVolatilePool(reserve0, reserve1);
    }
  }

  private static extractPriceRatioFromResult(
    multicallResult: ContractCallResults,
    poolConfig: PoolConfig
  ): Decimal {
    const reserves0 = this.decimal(
      multicallResult.results.poolContract.callsReturnContext[0].returnValues[0]
    );
    const reserves1 = this.decimal(
      multicallResult.results.poolContract.callsReturnContext[0].returnValues[1]
    );
    return this.getPriceRatio(reserves0, reserves1, poolConfig);
  }

  private static getPriceRatio(
    reserve0: Decimal,
    reserve1: Decimal,
    poolConfig: PoolConfig
  ) {
    const decimalsDifferenceMultiplier = new Decimal(
      TEN_AS_BASE_OF_POWER
    ).toPower(poolConfig.token0Decimals - poolConfig.token1Decimals);
    const reserve1Adjusted = reserve1.mul(decimalsDifferenceMultiplier);
    return this.reservesToPrice(reserve0, reserve1Adjusted, poolConfig);
  }

  override calculateSpotPrice(
    assetId: string,
    multicallResult: MulticallResult
  ) {
    const otherAssetLastPrice = VelodromeOnChainFetcher.getLastPriceOrThrow(
      multicallResult.pairedToken
    );
    const isSymbol1Current = this.poolsConfig[assetId].token1Symbol === assetId;
    const priceMultiplier = isSymbol1Current
      ? 1.0 / multicallResult.priceRatio
      : multicallResult.priceRatio;
    return otherAssetLastPrice * priceMultiplier;
  }

  private static dataFeedIdAmountToNumber(amount: string): number {
    if (amount.endsWith("K")) {
      return 1000 * Number(amount.slice(0, -1));
    } else {
      return Number(amount);
    }
  }

  override calculateSlippage(
    assetId: string,
    response: MulticallResult
  ): number {
    const { priceAction, amount } = parseSlippageDataFeedId(assetId);
    const normalizedAmount =
      VelodromeOnChainFetcher.dataFeedIdAmountToNumber(amount);
    const normalizedPriceAction = priceAction.toLowerCase() as PriceAction;
    return response.slippage[
      VelodromeOnChainFetcher.createSlippageLabel(
        normalizedAmount,
        normalizedPriceAction
      )
    ];
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
  ): ContractCallContext {
    const callContext: ContractCallContext = {
      reference: "poolContract",
      contractAddress: this.poolsConfig[assetId].poolAddress,
      abi: abi.abi,
      calls: [
        {
          reference: "reserves",
          methodName: "getReserves",
          methodParameters: [],
        },
      ],
    };
    const quoterCalls = [];
    for (const slippageLabel in multicallParams.slippageParams) {
      quoterCalls.push({
        reference: slippageLabel,
        methodName: "getAmountOut",
        methodParameters: [
          multicallParams.slippageParams[slippageLabel].amountIn,
          multicallParams.slippageParams[slippageLabel].tokenIn,
        ],
      });
    }
    callContext.calls.push(...quoterCalls);
    return callContext;
  }
}
