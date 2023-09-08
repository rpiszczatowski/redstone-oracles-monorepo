import { SwapType } from "@balancer-labs/sdk";
import { AddressZero } from "@ethersproject/constants";
import { BigNumberish, providers } from "ethers";
import Decimal from "decimal.js";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import { getLastPrice, getLastPriceOrFail } from "../../db/local-db";
import BalancerVaultAbi from "./BalancerVault.abi.json";
import { ContractCallContext } from "ethereum-multicall";
import { MathUtils, RedstoneTypes, RedstoneCommon } from "redstone-utils";
import {
  DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE,
  calculateSlippage,
  convertUsdToTokenAmount,
} from "../SlippageAndLiquidityCommons";

export const BALANCER_VAULT_ADDRESS =
  "0xBA12222222228d8Ba445958a75a0704d566BF2C8";

const SLIPPAGE_BUY_LABEL = "slippage_buy";
const SLIPPAGE_SELL_LABEL = "slippage_sell";
const SPOT_PRICE_LABEL = "balancer_vault";
const VAULT_CALLS = "balancer_vault";

const FUNDS = {
  sender: AddressZero,
  recipient: AddressZero,
  fromInternalBalance: false,
  toInternalBalance: false,
};

type BalancerPoolConfig = {
  baseTokenDecimals: number;
  pairedTokenDecimals: number;
  swaps: SwapConfig[];
  tokenAddresses: string[];
  tokenToFetch?: string;
};

type BalancerPoolsConfigs = {
  [baseToken: string]: BalancerPoolConfig;
};

interface SwapConfig {
  poolId: string;
  assetInIndex: number;
  assetOutIndex: number;
  amount: string;
  userData: string;
}

type BatchSwapParams = [SwapType, SwapConfig[], string[], typeof FUNDS];

interface BalancerResponse {
  spotPrice: string;
  buySlippage?: string;
  sellSlippage?: string;
}

export class BalancerMultiFetcher extends DexOnChainFetcher<BalancerResponse> {
  constructor(
    name: string,
    private readonly configs: BalancerPoolsConfigs,
    private readonly underlyingToken: string,
    private readonly provider: providers.Provider
  ) {
    super(name);
  }

  override async makeRequest(assetId: string): Promise<BalancerResponse> {
    const { baseTokenDecimals, pairedTokenDecimals, swaps, tokenAddresses } =
      this.configs[assetId];
    const pairedToken =
      this.configs[assetId].tokenToFetch ?? this.underlyingToken;
    const pairedTokenPrice = getLastPriceOrFail(pairedToken).value;
    const baseTokenPrice = getLastPrice(assetId)?.value;
    const baseTokenScaler = new MathUtils.PrecisionScaler(baseTokenDecimals);
    const pairedTokenScaler = new MathUtils.PrecisionScaler(
      pairedTokenDecimals
    );
    let swapAmountBase: string | undefined;
    if (baseTokenPrice) {
      swapAmountBase = convertUsdToTokenAmount(
        assetId,
        baseTokenScaler.tokenDecimalsScaler.toNumber(),
        DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE
      );
    }
    const swapAmountPaired = convertUsdToTokenAmount(
      pairedToken,
      pairedTokenScaler.tokenDecimalsScaler.toNumber(),
      DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE
    );

    const callContexts = BalancerMultiFetcher.buildContractCallContext(
      swapAmountBase,
      swapAmountPaired,
      swaps,
      tokenAddresses
    );
    const multicallResult = await RedstoneCommon.callMulticall(
      this.provider,
      callContexts
    );

    const pairedPriceInBase = this.extractPriceFromMulticallResult(
      multicallResult,
      assetId,
      baseTokenScaler,
      pairedTokenScaler
    );
    const basePriceInPaired = new Decimal(1).div(pairedPriceInBase);
    let buySlippage: string | undefined;
    let sellSlippage: string | undefined;
    if (baseTokenPrice) {
      const slippageSellAmountOut =
        BalancerMultiFetcher.extractAmountOutFromMulticallResult(
          multicallResult,
          tokenAddresses,
          SLIPPAGE_SELL_LABEL,
          tokenAddresses[tokenAddresses.length - 1]
        );
      const slippageBuyAmountOut =
        BalancerMultiFetcher.extractAmountOutFromMulticallResult(
          multicallResult,
          tokenAddresses,
          SLIPPAGE_BUY_LABEL,
          tokenAddresses[0]
        );
      const buyPrice = BalancerMultiFetcher.getPrice(
        new Decimal(swapAmountPaired),
        slippageBuyAmountOut,
        pairedTokenScaler,
        baseTokenScaler
      );
      const sellPrice = BalancerMultiFetcher.getPrice(
        new Decimal(swapAmountBase!),
        slippageSellAmountOut,
        baseTokenScaler,
        pairedTokenScaler
      );
      buySlippage = calculateSlippage(basePriceInPaired, buyPrice);
      sellSlippage = calculateSlippage(pairedPriceInBase, sellPrice);
    }
    return {
      spotPrice: basePriceInPaired.mul(pairedTokenPrice).toString(),
      sellSlippage,
      buySlippage,
    };
  }

  private static extractAmountOutFromMulticallResult(
    multicallResult: RedstoneCommon.MulticallResult,
    tokenAddresses: string[],
    slippageLabel: string,
    tokenToExtractAddress: string
  ) {
    const tokensOutDeltas = this.convertDeltas(
      tokenAddresses,
      multicallResult.getResults(VAULT_CALLS, slippageLabel)
    );
    return tokensOutDeltas[tokenToExtractAddress].abs();
  }

  private extractPriceFromMulticallResult(
    multicallResult: RedstoneCommon.MulticallResult,
    assetId: string,
    baseTokenScaler: MathUtils.PrecisionScaler,
    pairedTokenScaler: MathUtils.PrecisionScaler
  ): Decimal {
    const { swaps, tokenAddresses } = this.configs[assetId];
    const deltasSpot = BalancerMultiFetcher.convertDeltas(
      tokenAddresses,
      multicallResult.getResults(VAULT_CALLS, SPOT_PRICE_LABEL)
    );
    const pairedTokensOut = pairedTokenScaler.fromSolidityValue(
      String(deltasSpot[tokenAddresses[tokenAddresses.length - 1]].abs())
    );
    const baseTokensIn = baseTokenScaler.fromSolidityValue(swaps[0].amount);

    return baseTokensIn.div(pairedTokensOut);
  }

  override calculateSpotPrice(
    _assetId: string,
    response: BalancerResponse
  ): string {
    return response.spotPrice;
  }

  override calculateLiquidity(
    _assetId: string,
    _response: BalancerResponse
  ): undefined {
    return undefined;
  }

  override calculateSlippage(
    _assetId: string,
    response: BalancerResponse
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

  private static convertDeltas(
    tokenAddresses: string[],
    deltas: BigNumberish[]
  ): { [token: string]: Decimal } {
    return Object.fromEntries(
      deltas.map((delta: BigNumberish, idx: number) => [
        tokenAddresses[idx],
        RedstoneCommon.bignumberishToDecimal(delta),
      ])
    );
  }

  private static swapsConfigForSellSlippage(
    swapsForSpot: SwapConfig[],
    newInitialAmount: string
  ): SwapConfig[] {
    // we only want to change initial trade amount
    const swapsCopy = swapsForSpot.slice();
    swapsCopy[0] = { ...swapsCopy[0], amount: newInitialAmount };
    return swapsCopy;
  }

  private static reverseTokensOrder(swap: SwapConfig): SwapConfig {
    return {
      ...swap,
      amount: "0", // reset original trade amount
      assetInIndex: swap.assetOutIndex,
      assetOutIndex: swap.assetInIndex,
    };
  }

  private static swapsConfigForBuySlippage(
    swapsForSpot: SwapConfig[],
    initialAmount: string
  ): SwapConfig[] {
    // we need to reverse swaps order and set new trade amount
    const swapsCopy = swapsForSpot
      .slice()
      .reverse()
      .map(this.reverseTokensOrder);
    swapsCopy[0].amount = initialAmount;
    return swapsCopy;
  }

  private static createBatchSwapCall(label: string, params: BatchSwapParams) {
    return RedstoneCommon.prepareCall(label, "queryBatchSwap", params);
  }

  private static createBatchSwapParams(
    swaps: SwapConfig[],
    tokenAddresses: string[]
  ): BatchSwapParams {
    return [SwapType.SwapExactIn, swaps, tokenAddresses, FUNDS];
  }

  private static buildContractCallContext(
    swapAmountBase: string | undefined,
    swapAmountPaired: string,
    swapsForSpotCalculation: SwapConfig[],
    tokenAddresses: string[]
  ): ContractCallContext {
    const swapsForSpotParams = this.createBatchSwapParams(
      swapsForSpotCalculation,
      tokenAddresses
    );
    const callContexts = [
      this.createBatchSwapCall(SPOT_PRICE_LABEL, swapsForSpotParams),
    ];
    if (swapAmountBase) {
      const swapsForSellSlippage = this.swapsConfigForSellSlippage(
        swapsForSpotCalculation,
        swapAmountBase
      );
      const swapsForBuySlippage = this.swapsConfigForBuySlippage(
        swapsForSpotCalculation,
        swapAmountPaired
      );
      const slippageSellParams = this.createBatchSwapParams(
        swapsForSellSlippage,
        tokenAddresses
      );
      const slippageBuyParams = this.createBatchSwapParams(
        swapsForBuySlippage,
        tokenAddresses
      );
      callContexts.push(
        this.createBatchSwapCall(SLIPPAGE_SELL_LABEL, slippageSellParams),
        this.createBatchSwapCall(SLIPPAGE_BUY_LABEL, slippageBuyParams)
      );
    }
    return RedstoneCommon.prepareContractCall(
      VAULT_CALLS,
      BALANCER_VAULT_ADDRESS,
      BalancerVaultAbi,
      callContexts
    );
  }
}
