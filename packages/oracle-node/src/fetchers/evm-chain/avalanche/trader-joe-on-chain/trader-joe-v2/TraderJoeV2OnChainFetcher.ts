import Decimal from "decimal.js";
import {
  ContractCallContext,
  ContractCallResults,
  Multicall,
} from "ethereum-multicall";
import { BigNumber, ethers, providers } from "ethers";
import { SlippageData } from "redstone-utils/src/types";
import { getLastPrice, getRawPriceOrFail } from "../../../../../db/local-db";
import { DexOnChainFetcher } from "../../../../dex-on-chain/DexOnChainFetcher";
import pairAbi from "./TraderJoeV2LBPair.abi.json";
import routerAbi from "./TraderJoeV2LBRouter.abi.json";

// Price calculation based on https://docs.traderjoexyz.com/guides/price-from-id
const ONE_AS_DECIMAL = new Decimal(1);
const BIN_STEP_DIVIDER = 10000;
const BIN_ID_DEFAULT_SUBTRACTION = 8388608;
const SLIPPAGE_SIMULATION_AMOUT = 10_000;
const HUNDERD_PERCENT = 100;

interface MulticallResult {
  spotPrice: Decimal;
  buySlippage?: Decimal;
  sellSlippage?: Decimal;
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
  protected retryForInvalidResponse: boolean = true;

  constructor(
    name: string,
    private readonly pairsConfig: PairsConfig,
    private readonly provider: providers.Provider
  ) {
    super(name);
  }

  multicallAddress: undefined | string = undefined;
  public overrideMulticallAddress(address: string) {
    this.multicallAddress = address;
  }

  override async makeRequest(assetId: string): Promise<MulticallResult> {
    const baseTokenConfig = this.getBaseTokenConfig(assetId);
    const pairedTokenConfig = this.getPairedTokenConfig(assetId);
    const baseTokenPrice = getLastPrice(assetId)?.value;
    const pairedTokenPrice = Number(
      getRawPriceOrFail(pairedTokenConfig.symbol).value
    );
    let swapAmountBase: Decimal | undefined;
    const swapAmountPaired = this.convertDollarsToSubTokens(
      SLIPPAGE_SIMULATION_AMOUT,
      pairedTokenPrice,
      pairedTokenConfig.decimals
    );
    if (baseTokenPrice) {
      swapAmountBase = this.convertDollarsToSubTokens(
        SLIPPAGE_SIMULATION_AMOUT,
        baseTokenPrice,
        baseTokenConfig.decimals
      );
    }
    const callContexts = this.buildContractCallContext(
      assetId,
      swapAmountBase,
      swapAmountPaired
    );

    const multicallResult: ContractCallResults =
      await this.createMulticallInstance().call(callContexts);

    const spotPrice = this.getSpotPriceFromMulticallResult(
      multicallResult,
      pairedTokenPrice
    );
    let buySlippage: Decimal | undefined;
    let sellSlippage: Decimal | undefined;
    if (baseTokenPrice) {
      const basePriceInPaired = baseTokenPrice / pairedTokenPrice;
      const pairedPriceInBase = pairedTokenPrice / baseTokenPrice;
      buySlippage = this.getSlippageInPercent(
        swapAmountPaired,
        this.getTokensOutFromMulticallResult(multicallResult, "slippage_buy"),
        pairedTokenConfig.decimals,
        baseTokenConfig.decimals,
        basePriceInPaired
      );
      sellSlippage = this.getSlippageInPercent(
        swapAmountBase!,
        this.getTokensOutFromMulticallResult(multicallResult, "slippage_sell"),
        baseTokenConfig.decimals,
        pairedTokenConfig.decimals,
        pairedPriceInBase
      );
    }
    return { spotPrice, buySlippage, sellSlippage };
  }

  override calculateSpotPrice(
    _assetId: string,
    response: MulticallResult
  ): string {
    return response.spotPrice.toString();
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
  ): SlippageData[] {
    if (!response.buySlippage || !response.sellSlippage) {
      return [];
    }
    return [
      {
        direction: "buy",
        simulationValueInUsd: String(SLIPPAGE_SIMULATION_AMOUT),
        slippageAsPercent: response.buySlippage.toString(),
      },
      {
        direction: "sell",
        simulationValueInUsd: String(SLIPPAGE_SIMULATION_AMOUT),
        slippageAsPercent: response.sellSlippage.toString(),
      },
    ];
  }

  private getTokensOutFromMulticallResult(
    multicallResult: ContractCallResults,
    callReference: string
  ): Decimal {
    return this.decimal(
      multicallResult.results.routerContract?.callsReturnContext.find(
        (result) => result.reference === callReference
      )!.returnValues[1]
    );
  }

  private getSpotPriceFromMulticallResult(
    multicallResult: ContractCallResults,
    pairedTokenPrice: number
  ) {
    const poolResults = multicallResult.results.poolContract.callsReturnContext;
    const binStep = this.decimal(
      poolResults.find((result) => result.reference === "getBinStep")!
        .returnValues[0]
    );
    const binId = this.decimal(
      poolResults.find((result) => result.reference === "getActiveId")!
        .returnValues[0]
    );
    const binStepDivided = binStep.div(BIN_STEP_DIVIDER);
    const binStepPlusOne = ONE_AS_DECIMAL.add(binStepDivided);
    const binIdSerialized = binId.sub(BIN_ID_DEFAULT_SUBTRACTION);

    const baseInPairedPrice = binStepPlusOne.pow(binIdSerialized);
    const basePriceInDollars = baseInPairedPrice.mul(pairedTokenPrice);
    return basePriceInDollars;
  }

  private convertSubTokensToTokens(amount: Decimal, decimals: number): Decimal {
    return amount.div(this.decimal(10).toPower(decimals));
  }

  private getSlippageInPercent(
    subtokensIn: Decimal,
    subtokensOut: Decimal,
    tokensInDecimals: number,
    tokensOutDecimals: number,
    spotPrice: number
  ): Decimal {
    const tokensSent = this.convertSubTokensToTokens(
      subtokensIn,
      tokensInDecimals
    );
    const tokensGot = this.convertSubTokensToTokens(
      subtokensOut,
      tokensOutDecimals
    );
    const actualPrice = tokensSent.div(tokensGot);
    return actualPrice
      .sub(spotPrice)
      .abs()
      .div(actualPrice)
      .mul(HUNDERD_PERCENT);
  }

  private decimal(bigNumberLike: {}): Decimal {
    return new Decimal(BigNumber.from(bigNumberLike).toString());
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

  private getPairedTokenConfig(assetId: string) {
    const pairedTokenConfig = this.getTokenConfig(
      assetId,
      !this.isXBase(assetId)
    );
    const pairedTokenSymbol = this.pairsConfig[assetId].pairedToken;
    if (pairedTokenSymbol) {
      pairedTokenConfig.symbol = pairedTokenSymbol;
    }
    return pairedTokenConfig;
  }

  private convertDollarsToSubTokens(
    amountInDolars: number,
    tokenPrice: number,
    tokenDecimals: number
  ): Decimal {
    return this.decimal(
      ethers.utils
        .parseUnits(
          (amountInDolars / tokenPrice).toFixed(tokenDecimals),
          tokenDecimals
        )
        .toString()
    );
  }

  private createMulticallInstance() {
    return new Multicall({
      ethersProvider: this.provider,
      tryAggregate: false, // throw on error
      multicallCustomContractAddress: this.multicallAddress,
    });
  }

  private buildContractCallContext(
    assetId: string,
    swapAmountBase: Decimal | undefined,
    swapAmountPaired: Decimal
  ): ContractCallContext[] {
    const poolAddress = this.pairsConfig[assetId].pairAddress;

    const calls: ContractCallContext[] = [this.preparePoolCall(poolAddress)];
    if (swapAmountBase) {
      const routerCall = this.prepareRouterCall(
        poolAddress,
        assetId,
        swapAmountPaired,
        swapAmountBase
      );
      calls.push(routerCall);
    }
    return calls;
  }

  private preparePoolCall(poolAddress: string) {
    return {
      reference: "poolContract",
      contractAddress: poolAddress,
      abi: pairAbi,
      calls: [
        {
          reference: "getActiveId",
          methodName: "getActiveId",
          methodParameters: [],
        },
        {
          reference: "getBinStep",
          methodName: "getBinStep",
          methodParameters: [],
        },
      ],
    };
  }

  private prepareRouterCall(
    poolAddress: string,
    assetId: string,
    swapAmountPaired: Decimal,
    swapAmountBase: Decimal
  ) {
    return {
      reference: "routerContract",
      contractAddress: this.pairsConfig[assetId].routerAddress,
      abi: routerAbi.abi,
      calls: [
        {
          reference: "slippage_buy",
          methodName: "getSwapOut",
          methodParameters: [
            poolAddress,
            swapAmountPaired.toString(),
            !this.isXBase(assetId),
          ],
        },
        {
          reference: "slippage_sell",
          methodName: "getSwapOut",
          methodParameters: [
            poolAddress,
            swapAmountBase.toString(),
            this.isXBase(assetId),
          ],
        },
      ],
    };
  }
}
