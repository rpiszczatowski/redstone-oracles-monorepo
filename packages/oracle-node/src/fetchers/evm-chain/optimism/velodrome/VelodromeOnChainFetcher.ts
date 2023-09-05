import { Decimal } from "decimal.js";
import {
  CallReturnContext,
  ContractCallContext,
  ContractCallResults,
  Multicall,
} from "ethereum-multicall";
import { BigNumber, providers } from "ethers";
import { MathUtils, RedstoneTypes } from "redstone-utils";
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

  multicallAddress: undefined | string = undefined;
  public overrideMulticallAddress(address: string) {
    this.multicallAddress = address;
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
    const baseTokenScaler = new MathUtils.PrecisionScaler(baseToken.decimals);
    const quoteTokenScaler = new MathUtils.PrecisionScaler(quoteToken.decimals);
    const swapAmountBase = tryConvertUsdToTokenAmount(
      baseToken.symbol,
      baseTokenScaler.tokenDecimalsScaler.toNumber(),
      DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE
    );
    const swapAmountPaired = convertUsdToTokenAmount(
      poolConfig.pairedToken ?? quoteToken.symbol,
      quoteTokenScaler.tokenDecimalsScaler.toNumber(),
      DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE
    );
    const multicallContext = this.buildContractCallContext(
      assetId,
      swapAmountBase,
      swapAmountPaired,
      baseToken.address,
      quoteToken.address
    );
    const multicallResult = await this.createMulticallInstance().call(
      multicallContext
    );
    const reservesResult = VelodromeOnChainFetcher.getResultByLabel(
      multicallResult,
      RESERVES_LABEL
    );
    const spotPrice = VelodromeOnChainFetcher.extractSpotPriceFromResult(
      assetId,
      reservesResult,
      poolConfig
    );
    let buySlippage: string | undefined;
    let sellSlippage: string | undefined;
    if (baseTokenPrice) {
      const buyResult = VelodromeOnChainFetcher.getResultByLabel(
        multicallResult,
        SLIPPAGE_BUY_LABEL
      );
      const sellResult = VelodromeOnChainFetcher.getResultByLabel(
        multicallResult,
        SLIPPAGE_SELL_LABEL
      );
      const buyPrice = VelodromeOnChainFetcher.getPriceAfterSwap(
        reservesResult,
        buyResult,
        poolConfig
      );
      const sellPrice = VelodromeOnChainFetcher.getPriceAfterSwap(
        reservesResult,
        sellResult,
        poolConfig
      );
      buySlippage = calculateSlippage(spotPrice, buyPrice);
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

  private static getResultByLabel(
    multicallResult: ContractCallResults,
    label: string
  ): CallReturnContext {
    return multicallResult.results[POOL_LABEL].callsReturnContext.find(
      (result) => result.reference === label
    )!;
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
    reservesResult: CallReturnContext,
    poolConfig: PoolConfig
  ): Decimal {
    const reserves0 = this.decimal(reservesResult.returnValues[0]);
    const reserves1 = this.decimal(reservesResult.returnValues[1]);
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

  private createMulticallInstance() {
    return new Multicall({
      ethersProvider: this.provider,
      tryAggregate: false,
      multicallCustomContractAddress: this.multicallAddress,
    });
  }

  private buildContractCallContext(
    assetId: string,
    swapAmountBase: string | undefined,
    swapAmountQuote: string,
    baseTokenAddress: string,
    quoteTokenAddress: string
  ): ContractCallContext {
    const poolConfig = this.poolsConfig[assetId];
    const callContext: ContractCallContext = {
      reference: POOL_LABEL,
      contractAddress: poolConfig.poolAddress,
      abi: abi.abi,
      calls: [
        {
          reference: RESERVES_LABEL,
          methodName: "getReserves",
          methodParameters: [],
        },
      ],
    };
    if (swapAmountBase) {
      callContext.calls.push({
        reference: SLIPPAGE_BUY_LABEL,
        methodName: "getAmountOut",
        methodParameters: [swapAmountQuote, quoteTokenAddress],
      });
      callContext.calls.push({
        reference: SLIPPAGE_SELL_LABEL,
        methodName: "getAmountOut",
        methodParameters: [swapAmountBase, baseTokenAddress],
      });
    }
    return callContext;
  }
}
