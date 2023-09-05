import { Decimal } from "decimal.js";
import {
  ContractCallContext,
  ContractCallResults,
  Multicall,
} from "ethereum-multicall";
import { BigNumber, BigNumberish, providers } from "ethers";
import { MathUtils, RedstoneTypes } from "redstone-utils";
import { getLastPrice, getLastPriceOrFail } from "../../db/local-db";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import { TEN_AS_BASE_OF_POWER } from "../evm-chain/shared/contants";
import {
  DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE,
  convertUsdToTokenAmount,
  calculateSlippage,
  tryConvertUsdToTokenAmount,
} from "../SlippageAndLiquidityCommons";
import {
  Abis,
  FunctionNames,
  MulticallResult,
  PoolConfig,
  PoolsConfig,
  TokenConfig,
} from "./types";

const SLOT0_LABEL = "slot0";
const SLIPPAGE_BUY_LABEL = "slippage_buy";
const SLIPPAGE_SELL_LABEL = "slippage_sell";
const POOL_LABEL = "pool_contract";
const QUOTER_LABEL = "quoter_contract";

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

  multicallAddress: undefined | string = undefined;
  public overrideMulticallAddress(address: string) {
    this.multicallAddress = address;
  }

  async makeRequest(assetId: string): Promise<MulticallResult> {
    const poolConfig = this.poolsConfig[assetId];
    const baseToken = UniswapV3LikeFetcher.getBaseTokenConfig(
      assetId,
      poolConfig
    );
    const quoteToken = UniswapV3LikeFetcher.getQuoteTokenConfig(
      assetId,
      poolConfig
    );
    const baseTokenScaler = new MathUtils.PrecisionScaler(baseToken.decimals);
    const quoteTokenScaler = new MathUtils.PrecisionScaler(quoteToken.decimals);
    const baseTokenPrice = getLastPrice(baseToken.symbol)?.value;
    const quoteTokenPrice = getLastPriceOrFail(
      poolConfig.pairedToken ?? quoteToken.symbol
    ).value;
    const swapAmountBase = tryConvertUsdToTokenAmount(
      baseToken.symbol,
      baseTokenScaler.tokenDecimalsScaler.toNumber(),
      DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE
    );
    const swapAmountQuote = convertUsdToTokenAmount(
      poolConfig.pairedToken ?? quoteToken.symbol,
      quoteTokenScaler.tokenDecimalsScaler.toNumber(),
      DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE
    );

    const multicallContext = this.buildContractCallContext(
      assetId,
      swapAmountBase,
      swapAmountQuote
    );
    const multicallResult = await this.createMulticallInstance().call(
      multicallContext
    );

    const spotPrice = UniswapV3LikeFetcher.extractSpotPriceFromMulticallResult(
      multicallResult,
      assetId,
      poolConfig
    );
    let buySlippage: string | undefined;
    let sellSlippage: string | undefined;
    if (baseTokenPrice) {
      const slippageBuyAmountOut = UniswapV3LikeFetcher.getAmountOut(
        multicallResult,
        SLIPPAGE_BUY_LABEL
      );
      const buyPrice = this.getPrice(
        new Decimal(swapAmountQuote),
        slippageBuyAmountOut,
        quoteTokenScaler,
        baseTokenScaler
      );
      buySlippage = calculateSlippage(spotPrice, buyPrice);

      const slippageSellAmountOut = UniswapV3LikeFetcher.getAmountOut(
        multicallResult,
        SLIPPAGE_SELL_LABEL
      );
      const sellPrice = this.getPrice(
        new Decimal(swapAmountBase!),
        slippageSellAmountOut,
        baseTokenScaler,
        quoteTokenScaler
      );
      sellSlippage = calculateSlippage(
        new Decimal(1).div(spotPrice),
        sellPrice
      );
    }
    return {
      spotPrice: spotPrice.mul(quoteTokenPrice).toString(),
      buySlippage,
      sellSlippage,
    };
  }

  override calculateSpotPrice(_assetId: string, response: MulticallResult) {
    return response.spotPrice;
  }

  override calculateSlippage(
    _assetId: string,
    response: MulticallResult
  ): RedstoneTypes.SlippageData[] {
    if (!response.buySlippage || !response.sellSlippage) {
      return [];
    }

    return [
      {
        direction: "buy",
        simulationValueInUsd: String(DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE),
        slippageAsPercent: response.buySlippage,
      },
      {
        direction: "sell",
        simulationValueInUsd: String(DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE),
        slippageAsPercent: response.sellSlippage,
      },
    ];
  }

  private getPrice(
    subtokensIn: Decimal,
    subtokensOut: Decimal,
    tokensInScaler: MathUtils.PrecisionScaler,
    tokensOutScaler: MathUtils.PrecisionScaler
  ): Decimal {
    const tokensIn = tokensInScaler.fromSolidityValue(subtokensIn.toString());
    const tokensOut = tokensOutScaler.fromSolidityValue(
      subtokensOut.toString()
    );
    return tokensIn.div(tokensOut);
  }

  private static getTokenConfig(
    assetId: string,
    poolConfig: PoolConfig,
    base: boolean
  ): TokenConfig {
    const isSymbol1Current = poolConfig.token1Symbol === assetId;
    return base === isSymbol1Current
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

  private static getBaseTokenConfig(assetId: string, poolConfig: PoolConfig) {
    return this.getTokenConfig(assetId, poolConfig, true);
  }

  private static getQuoteTokenConfig(assetId: string, poolConfig: PoolConfig) {
    return this.getTokenConfig(assetId, poolConfig, false);
  }

  private static decimal(bigNumberLike: BigNumberish): Decimal {
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
      multicallResult.results[POOL_LABEL].callsReturnContext[0].returnValues[0]
    );
    return this.sqrtPriceX96ToPrice(sqrtPriceX96BeforeSwap);
  }

  private static getAmountOut(
    multicallResult: ContractCallResults,
    slippageLabel: string
  ): Decimal {
    return this.decimal(
      multicallResult.results[QUOTER_LABEL].callsReturnContext.find(
        (result) => result.reference === slippageLabel
      )!.returnValues[0]
    );
  }

  private static extractSpotPriceFromMulticallResult(
    multicallResult: ContractCallResults,
    assetId: string,
    poolConfig: PoolConfig
  ): Decimal {
    const priceInTermsOfSubtokens = this.getPriceBeforeSwap(multicallResult);
    const decimalsDifferenceMultiplier = new Decimal(
      TEN_AS_BASE_OF_POWER
    ).toPower(poolConfig.token0Decimals - poolConfig.token1Decimals);
    const token1InToken0Price = priceInTermsOfSubtokens.times(
      decimalsDifferenceMultiplier
    );

    const baseInQuotePrice =
      poolConfig.token1Symbol === assetId
        ? new Decimal(1).div(token1InToken0Price)
        : token1InToken0Price;
    return baseInQuotePrice;
  }

  private createMulticallInstance() {
    return new Multicall({
      ethersProvider: this.provider,
      tryAggregate: false, // throw on error
      multicallCustomContractAddress: this.multicallAddress,
    });
  }

  private createSlot0Call(poolAddress: string) {
    return {
      reference: POOL_LABEL,
      contractAddress: poolAddress,
      abi: this.abis.poolAbi,
      calls: [
        {
          reference: SLOT0_LABEL,
          methodName: this.functionNames.slot0FunctionName,
          methodParameters: [],
        },
      ],
    };
  }

  protected createQuoterParams(
    tokenIn: string,
    tokenOut: string,
    fee: number,
    amountIn: string
  ): unknown {
    return {
      tokenIn,
      tokenOut,
      fee,
      amountIn,
      sqrtPriceLimitX96: 0,
    };
  }

  private createQuoterCall(
    assetId: string,
    swapAmountBase: string,
    swapAmountPaired: string
  ) {
    const poolConfig = this.poolsConfig[assetId];

    const baseToken = UniswapV3LikeFetcher.getBaseTokenConfig(
      assetId,
      poolConfig
    );
    const quoteToken = UniswapV3LikeFetcher.getQuoteTokenConfig(
      assetId,
      poolConfig
    );
    const quoterAddress = poolConfig.quoterAddress;
    return {
      reference: QUOTER_LABEL,
      contractAddress: quoterAddress,
      abi: this.abis.quoterAbi,
      calls: [
        {
          reference: SLIPPAGE_BUY_LABEL,
          methodName: this.functionNames.quoteFunctionName,
          methodParameters: [
            this.createQuoterParams(
              quoteToken.address,
              baseToken.address,
              poolConfig.fee,
              swapAmountPaired
            ),
          ],
        },
        {
          reference: SLIPPAGE_SELL_LABEL,
          methodName: this.functionNames.quoteFunctionName,
          methodParameters: [
            this.createQuoterParams(
              baseToken.address,
              quoteToken.address,
              poolConfig.fee,
              swapAmountBase
            ),
          ],
        },
      ],
    };
  }

  private buildContractCallContext(
    assetId: string,
    swapAmountBase: string | undefined,
    swapAmountQuote: string
  ): ContractCallContext[] {
    const calls: ContractCallContext[] = [
      this.createSlot0Call(this.poolsConfig[assetId].poolAddress),
    ];
    if (swapAmountBase) {
      const quoterCall = this.createQuoterCall(
        assetId,
        swapAmountBase,
        swapAmountQuote
      );
      calls.push(quoterCall);
    }
    return calls;
  }
}
