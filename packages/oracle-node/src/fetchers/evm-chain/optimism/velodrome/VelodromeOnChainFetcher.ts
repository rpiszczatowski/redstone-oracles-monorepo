import { Decimal } from "decimal.js";
import { ContractCallContext } from "ethereum-multicall";
import { BigNumberish, providers } from "ethers";
import {
  MathUtils,
  RedstoneCommon,
  RedstoneTypes,
} from "@redstone-finance/utils";

import { getLastPrice, getLastPriceOrFail } from "../../../../db/local-db";
import { DexOnChainFetcher } from "../../../dex-on-chain/DexOnChainFetcher";
import {
  calculateSlippage,
  convertUsdToTokenAmount,
  DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE,
  tryConvertUsdToTokenAmount,
} from "../../../SlippageAndLiquidityCommons";
import { TEN_AS_BASE_OF_POWER } from "../../shared/contants";
import abi from "./abi.json";
import { MulticallResult, PoolConfig, PoolsConfig, TokenConfig } from "./types";

const SLIPPAGE_BUY_LABEL = "slippage_buy";
const SLIPPAGE_SELL_LABEL = "slippage_sell";
const POOL_LABEL = "pool_contract";
const RESERVES_LABEL = "quoter_contract";

export class VelodromeOnChainFetcher extends DexOnChainFetcher<MulticallResult> {
  constructor(
    name: string,
    private readonly poolsConfig: PoolsConfig,
    private readonly provider: providers.Provider
  ) {
    super(name);
  }

  override async makeRequest(assetId: string): Promise<MulticallResult | null> {
    const poolConfig = this.poolsConfig[assetId];

    const baseToken = VelodromeOnChainFetcher.getBaseTokenConfig(
      assetId,
      poolConfig
    );
    const quoteToken = VelodromeOnChainFetcher.getQuoteTokenConfig(
      assetId,
      poolConfig
    );
    const baseTokenPrice = getLastPrice(assetId)?.value;
    const quoteTokenPrice = getLastPriceOrFail(
      poolConfig.pairedToken ?? quoteToken.symbol
    ).value;
    const swapAmountBase = tryConvertUsdToTokenAmount(
      baseToken.symbol,
      DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE
    );
    const swapAmountPaired = convertUsdToTokenAmount(
      poolConfig.pairedToken ?? quoteToken.symbol,
      DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE
    );
    const multicallContext = this.buildContractCallContext(
      assetId,
      swapAmountBase,
      swapAmountPaired,
      baseToken.address,
      quoteToken.address
    );
    const multicallResult = await RedstoneCommon.callMulticall(
      this.provider,
      multicallContext
    );
    const basePriceInQuote = VelodromeOnChainFetcher.extractSpotPriceFromResult(
      assetId,
      multicallResult,
      poolConfig
    );
    const spotPrice = basePriceInQuote.mul(quoteTokenPrice).toString();
    if (!baseTokenPrice) {
      return { spotPrice };
    }
    const buyPrice = VelodromeOnChainFetcher.getPriceAfterSwap(
      multicallResult,
      SLIPPAGE_BUY_LABEL,
      poolConfig
    );
    const sellPrice = VelodromeOnChainFetcher.getPriceAfterSwap(
      multicallResult,
      SLIPPAGE_SELL_LABEL,
      poolConfig
    );
    const buySlippage = calculateSlippage(basePriceInQuote, buyPrice);
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

  private static getPriceAfterSwap(
    multicallResult: RedstoneCommon.MulticallResult,
    resultReference: string,
    poolConfig: PoolConfig
  ): Decimal {
    const reserves = multicallResult.getResults<BigNumberish>(
      POOL_LABEL,
      RESERVES_LABEL
    );
    const reserve0BeforeSwap = RedstoneCommon.bignumberishToDecimal(
      reserves[0]
    );
    const reserve1BeforeSwap = RedstoneCommon.bignumberishToDecimal(
      reserves[1]
    );
    let reserve0AfterSwap = reserve0BeforeSwap;
    let reserve1AfterSwap = reserve1BeforeSwap;

    const swapParams = multicallResult.getCallParams<string>(
      POOL_LABEL,
      resultReference
    );
    const swapResults = multicallResult.getResults<BigNumberish>(
      POOL_LABEL,
      resultReference
    );
    const tokensOut = RedstoneCommon.bignumberishToDecimal(swapResults[0]);
    const wasToken0Swapped = swapParams[1] === poolConfig.token0Address;
    if (wasToken0Swapped) {
      reserve0AfterSwap = reserve0AfterSwap.plus(swapParams[0]);
      reserve1AfterSwap = reserve1AfterSwap.minus(tokensOut);
    } else {
      reserve0AfterSwap = reserve0AfterSwap.minus(tokensOut);
      reserve1AfterSwap = reserve1AfterSwap.plus(swapParams[0]);
    }
    return this.getPrice(reserve0AfterSwap, reserve1AfterSwap, poolConfig);
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

  private static extractSpotPriceFromResult(
    assetId: string,
    reservesResult: RedstoneCommon.MulticallResult,
    poolConfig: PoolConfig
  ): Decimal {
    const reserves0 = RedstoneCommon.bignumberishToDecimal(
      reservesResult.getResult(POOL_LABEL, RESERVES_LABEL, 0)
    );
    const reserves1 = RedstoneCommon.bignumberishToDecimal(
      reservesResult.getResult(POOL_LABEL, RESERVES_LABEL, 1)
    );
    const token0InToken1Price = this.getPrice(reserves0, reserves1, poolConfig);

    const baseInQoutePrice =
      poolConfig.token1Symbol === assetId
        ? new Decimal(1).div(token0InToken1Price)
        : token0InToken1Price;
    return baseInQoutePrice;
  }

  private static getPrice(
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

  private buildContractCallContext(
    assetId: string,
    swapAmountBase: string | undefined,
    swapAmountQuote: string,
    baseTokenAddress: string,
    quoteTokenAddress: string
  ): ContractCallContext {
    const poolConfig = this.poolsConfig[assetId];
    const calls = [RedstoneCommon.prepareCall(RESERVES_LABEL, "getReserves")];

    if (swapAmountBase) {
      const buyParams = [swapAmountQuote, quoteTokenAddress];
      const sellParams = [swapAmountBase, baseTokenAddress];
      calls.push(
        RedstoneCommon.prepareCall(
          SLIPPAGE_BUY_LABEL,
          "getAmountOut",
          buyParams
        )
      );
      calls.push(
        RedstoneCommon.prepareCall(
          SLIPPAGE_SELL_LABEL,
          "getAmountOut",
          sellParams
        )
      );
    }
    return RedstoneCommon.prepareContractCall(
      POOL_LABEL,
      poolConfig.poolAddress,
      abi.abi,
      calls
    );
  }
}
