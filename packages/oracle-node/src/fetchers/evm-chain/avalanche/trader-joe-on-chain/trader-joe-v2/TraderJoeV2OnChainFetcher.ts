import Decimal from "decimal.js";
import { ContractCallContext } from "ethereum-multicall";
import { providers } from "ethers";
import {
  MathUtils,
  RedstoneCommon,
  RedstoneTypes,
} from "@redstone-finance/utils";
import { getLastPriceOrFail } from "../../../../../db/local-db";
import { DexOnChainFetcher } from "../../../../dex-on-chain/DexOnChainFetcher";
import {
  calculateSlippage,
  convertUsdToTokenAmount,
  DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE,
  tryConvertUsdToTokenAmount,
} from "../../../../SlippageAndLiquidityCommons";
import pairAbi from "./TraderJoeV2LBPair.abi.json";
import routerAbi from "./TraderJoeV2LBRouter.abi.json";

// Price calculation based on https://docs.traderjoexyz.com/guides/price-from-id
const ONE_AS_DECIMAL = new Decimal(1);
const BIN_STEP_DIVIDER = 10000;
const BIN_ID_DEFAULT_SUBTRACTION = 8388608;

const ROUTER_LABEL = "router_contract";
const POOL_LABEL = "pool_contract";
const ACTIVE_ID_LABEL = "active_id";
const BIN_STEP_LABEL = "bin_step";
const SLIPPAGE_BUY_LABEL = "slippage_buy";
const SLIPPAGE_SELL_LABEL = "slippage_sell";

interface MulticallResult {
  spotPrice: string;
  buySlippage?: string;
  sellSlippage?: string;
}

interface TokenConfig {
  symbol: string;
  decimals: number;
}

interface PairConfig {
  routerAddress: string;
  pairAddress: string;
  symbolX: string;
  symbolXDecimals: number;
  symbolY: string;
  symbolYDecimals: number;
  pairedToken?: string;
}

interface PairsConfig {
  [symbol: string]: PairConfig;
}

export class TraderJoeV2OnChainFetcher extends DexOnChainFetcher<MulticallResult> {
  protected override retryForInvalidResponse: boolean = true;

  constructor(
    name: string,
    private readonly pairsConfig: PairsConfig,
    private readonly provider: providers.Provider
  ) {
    super(name);
  }

  override async makeRequest(assetId: string): Promise<MulticallResult> {
    const baseTokenConfig = this.getBaseTokenConfig(assetId);
    const quoteTokenConfig = this.getQuoteTokenConfig(assetId);
    const quoteTokenPrice = getLastPriceOrFail(
      this.pairsConfig[assetId].pairedToken ?? quoteTokenConfig.symbol
    ).value;
    const baseTokenScaler = new MathUtils.PrecisionScaler(
      baseTokenConfig.decimals
    );
    const quoteTokenScaler = new MathUtils.PrecisionScaler(
      quoteTokenConfig.decimals
    );
    const swapAmountBase = tryConvertUsdToTokenAmount(
      assetId,
      DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE
    );
    const swapAmountQuote = convertUsdToTokenAmount(
      this.pairsConfig[assetId].pairedToken ?? quoteTokenConfig.symbol,
      DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE
    );
    const callContexts = this.buildContractCallContext(
      assetId,
      swapAmountBase,
      swapAmountQuote
    );

    const multicallResult = await RedstoneCommon.callMulticall(
      this.provider,
      callContexts
    );

    const basePriceInQuote =
      TraderJoeV2OnChainFetcher.getSpotPriceFromMulticallResult(
        multicallResult
      );
    const spotPrice = basePriceInQuote.mul(quoteTokenPrice).toString();
    if (!swapAmountBase) {
      return { spotPrice };
    }
    const buySlippageTokensOut =
      TraderJoeV2OnChainFetcher.getTokensOutFromMulticallResult(
        multicallResult,
        SLIPPAGE_BUY_LABEL
      );
    const buyPrice = TraderJoeV2OnChainFetcher.getPrice(
      swapAmountQuote,
      buySlippageTokensOut.toString(),
      quoteTokenScaler,
      baseTokenScaler
    );
    const buySlippage = calculateSlippage(basePriceInQuote, buyPrice);
    const sellSlippageTokensOut =
      TraderJoeV2OnChainFetcher.getTokensOutFromMulticallResult(
        multicallResult,
        SLIPPAGE_SELL_LABEL
      );
    const sellPrice = TraderJoeV2OnChainFetcher.getPrice(
      swapAmountBase,
      sellSlippageTokensOut.toString(),
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

  private static getPrice(
    subtokensIn: string,
    subtokensOut: string,
    tokensInScaler: MathUtils.PrecisionScaler,
    tokensOutScaler: MathUtils.PrecisionScaler
  ): Decimal {
    const tokensIn = tokensInScaler.fromSolidityValue(subtokensIn);
    const tokensOut = tokensOutScaler.fromSolidityValue(subtokensOut);
    return tokensIn.div(tokensOut);
  }

  override calculateSpotPrice(
    _assetId: string,
    response: MulticallResult
  ): string {
    return response.spotPrice;
  }

  override calculateLiquidity(
    _assetId: string,
    _response: MulticallResult
  ): undefined {
    // no clear definition of liquidity in trader-joe v2
    return undefined;
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

  private static getTokensOutFromMulticallResult(
    multicallResult: RedstoneCommon.MulticallResult,
    callReference: string
  ): Decimal {
    return RedstoneCommon.bignumberishToDecimal(
      multicallResult.getResult(ROUTER_LABEL, callReference, 1)
    );
  }

  private static getSpotPriceFromMulticallResult(
    multicallResult: RedstoneCommon.MulticallResult
  ) {
    const binStep = RedstoneCommon.bignumberishToDecimal(
      multicallResult.getResult(POOL_LABEL, BIN_STEP_LABEL, 0)
    );
    const binId = RedstoneCommon.bignumberishToDecimal(
      multicallResult.getResult(POOL_LABEL, ACTIVE_ID_LABEL, 0)
    );
    const binStepDivided = binStep.div(BIN_STEP_DIVIDER);
    const binStepPlusOne = ONE_AS_DECIMAL.add(binStepDivided);
    const binIdSerialized = binId.sub(BIN_ID_DEFAULT_SUBTRACTION);

    const baseInQuotePrice = binStepPlusOne.pow(binIdSerialized);
    return baseInQuotePrice;
  }

  private isXBase(assetId: string) {
    return this.pairsConfig[assetId].symbolX == assetId;
  }

  private getTokenConfig(assetId: string, isX: boolean) {
    return isX
      ? {
          symbol: this.pairsConfig[assetId].symbolX,
          decimals: this.pairsConfig[assetId].symbolXDecimals,
        }
      : {
          symbol: this.pairsConfig[assetId].symbolY,
          decimals: this.pairsConfig[assetId].symbolYDecimals,
        };
  }

  private getBaseTokenConfig(assetId: string): TokenConfig {
    return this.getTokenConfig(assetId, this.isXBase(assetId));
  }

  private getQuoteTokenConfig(assetId: string) {
    return this.getTokenConfig(assetId, !this.isXBase(assetId));
  }

  private buildContractCallContext(
    assetId: string,
    swapAmountBase: string | undefined,
    swapAmountQuote: string
  ): ContractCallContext[] {
    const poolAddress = this.pairsConfig[assetId].pairAddress;

    const calls: ContractCallContext[] = [
      TraderJoeV2OnChainFetcher.preparePoolCall(poolAddress),
    ];
    if (swapAmountBase) {
      const routerCall = this.prepareRouterCall(
        poolAddress,
        assetId,
        swapAmountQuote,
        swapAmountBase
      );
      calls.push(routerCall);
    }
    return calls;
  }

  private static preparePoolCall(poolAddress: string) {
    const calls = [
      RedstoneCommon.prepareCall(ACTIVE_ID_LABEL, "getActiveId"),
      RedstoneCommon.prepareCall(BIN_STEP_LABEL, "getBinStep"),
    ];
    return RedstoneCommon.prepareContractCall(
      POOL_LABEL,
      poolAddress,
      pairAbi,
      calls
    );
  }

  private prepareRouterCall(
    poolAddress: string,
    assetId: string,
    swapAmountQuote: string,
    swapAmountBase: string
  ) {
    const buyParams = [poolAddress, swapAmountQuote, !this.isXBase(assetId)];
    const sellParams = [poolAddress, swapAmountBase, this.isXBase(assetId)];
    const routerCalls = [
      RedstoneCommon.prepareCall(SLIPPAGE_BUY_LABEL, "getSwapOut", buyParams),
      RedstoneCommon.prepareCall(SLIPPAGE_SELL_LABEL, "getSwapOut", sellParams),
    ];
    return RedstoneCommon.prepareContractCall(
      ROUTER_LABEL,
      this.pairsConfig[assetId].routerAddress,
      routerAbi.abi,
      routerCalls
    );
  }
}
