import { Decimal } from "decimal.js";
import { ContractCallContext } from "ethereum-multicall";
import { providers } from "ethers";
import {
  MathUtils,
  RedstoneTypes,
  RedstoneCommon,
} from "@redstone-finance/utils";
import { getLastPriceOrFail } from "../../db/local-db";
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
    const multicallResult = await RedstoneCommon.callMulticall(
      this.provider,
      multicallContext
    );

    const basePriceInQuote =
      UniswapV3LikeFetcher.extractSpotPriceFromMulticallResult(
        multicallResult,
        assetId,
        poolConfig
      );
    const spotPrice = basePriceInQuote.mul(quoteTokenPrice).toString();
    if (!swapAmountBase) {
      return { spotPrice };
    }
    const slippageBuyAmountOut = UniswapV3LikeFetcher.getAmountOut(
      multicallResult,
      SLIPPAGE_BUY_LABEL
    );
    const buyPrice = UniswapV3LikeFetcher.getPrice(
      new Decimal(swapAmountQuote),
      slippageBuyAmountOut,
      quoteTokenScaler,
      baseTokenScaler
    );
    const buySlippage = calculateSlippage(basePriceInQuote, buyPrice);

    const slippageSellAmountOut = UniswapV3LikeFetcher.getAmountOut(
      multicallResult,
      SLIPPAGE_SELL_LABEL
    );
    const sellPrice = UniswapV3LikeFetcher.getPrice(
      new Decimal(swapAmountBase),
      slippageSellAmountOut,
      baseTokenScaler,
      quoteTokenScaler
    );
    const sellSlippage = calculateSlippage(
      new Decimal(1).div(basePriceInQuote),
      sellPrice
    );
    return {
      spotPrice,
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
        direction: RedstoneTypes.TradeDirection.BUY,
        simulationValueInUsd: String(DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE),
        slippageAsPercent: response.buySlippage,
      },
      {
        direction: RedstoneTypes.TradeDirection.SELL,
        simulationValueInUsd: String(DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE),
        slippageAsPercent: response.sellSlippage,
      },
    ];
  }

  private static getPrice(
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

  private static sqrtPriceX96ToPrice(uniswapV3SqrtPriceX96: Decimal): Decimal {
    // prices returned by uniswap v3 are square rooted and shifted by 96 bits to the left
    const priceShift = new Decimal(2).toPower(2 * 96);
    return uniswapV3SqrtPriceX96.toPower(2).div(priceShift);
  }

  private static getPriceBeforeSwap(
    multicallResult: RedstoneCommon.MulticallResult
  ): Decimal {
    const sqrtPriceX96BeforeSwap = RedstoneCommon.bignumberishToDecimal(
      multicallResult.getResult(POOL_LABEL, SLOT0_LABEL, 0)
    );
    return this.sqrtPriceX96ToPrice(sqrtPriceX96BeforeSwap);
  }

  private static getAmountOut(
    multicallResult: RedstoneCommon.MulticallResult,
    slippageLabel: string
  ): Decimal {
    return RedstoneCommon.bignumberishToDecimal(
      multicallResult.getResult(QUOTER_LABEL, slippageLabel, 0)
    );
  }

  private static extractSpotPriceFromMulticallResult(
    multicallResult: RedstoneCommon.MulticallResult,
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

  private createSlot0Call(poolAddress: string) {
    const slot0Call = RedstoneCommon.prepareCall(
      SLOT0_LABEL,
      this.functionNames.slot0FunctionName
    );
    return RedstoneCommon.prepareContractCall(
      POOL_LABEL,
      poolAddress,
      this.abis.poolAbi,
      [slot0Call]
    );
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected createQuoterParams(
    tokenIn: string,
    tokenOut: string,
    fee: number,
    amountIn: string
  ): unknown[] {
    return [
      {
        tokenIn,
        tokenOut,
        fee,
        amountIn,
        sqrtPriceLimitX96: 0,
      },
    ];
  }

  private createQuoterCall(
    assetId: string,
    swapAmountBase: string,
    swapAmountQuote: string
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
    const buyQuoterParams = this.createQuoterParams(
      quoteToken.address,
      baseToken.address,
      poolConfig.fee,
      swapAmountQuote
    );
    const slippageBuyCall = RedstoneCommon.prepareCall(
      SLIPPAGE_BUY_LABEL,
      this.functionNames.quoteFunctionName,
      buyQuoterParams
    );
    const sellQuoterParams = this.createQuoterParams(
      baseToken.address,
      quoteToken.address,
      poolConfig.fee,
      swapAmountBase
    );
    const slippageSellCall = RedstoneCommon.prepareCall(
      SLIPPAGE_SELL_LABEL,
      this.functionNames.quoteFunctionName,
      sellQuoterParams
    );
    return RedstoneCommon.prepareContractCall(
      QUOTER_LABEL,
      poolConfig.quoterAddress,
      this.abis.quoterAbi,
      [slippageBuyCall, slippageSellCall]
    );
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
