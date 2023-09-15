import Decimal from "decimal.js";
import { BigNumberish, providers } from "ethers";
import {
  MathUtils,
  RedstoneTypes,
  RedstoneCommon,
} from "@redstone-finance/utils";
import { getLastPriceOrFail } from "../../db/local-db";
import {
  DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE,
  calculateSlippage,
  convertUsdToTokenAmount,
  tryConvertUsdToTokenAmount,
} from "../SlippageAndLiquidityCommons";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import fetcherConfig from "./wombat-fetcher-config";
import { WOMBAT_POOL_ABI } from "./pool.abi";
import { ContractCallContext } from "ethereum-multicall";

const ROUTER_LABEL = "router";
const SPOT_PRICE_LABEL = "spot_price";
const SLIPPAGE_BUY_LABEL = "slippage_buy";
const SLIPPAGE_SELL_LABEL = "slippage_sell";

export interface FetcherConfig {
  provider: providers.Provider;
  tokens: {
    [dataFeedId: string]: PoolConfig;
  };
}

interface TokenConfig {
  address: string;
  symbol: string;
  decimals: number;
}

interface PoolConfig {
  baseToken: TokenConfig;
  quoteToken: TokenConfig;
  pairedToken?: string;
  poolAddress: string;
}
type SupportedIds = keyof (typeof fetcherConfig)["tokens"];

export interface WombatResponse {
  spotPrice: Decimal;
  buySlippage?: string;
  sellSlippage?: string;
}

export class WombatFetcher extends DexOnChainFetcher<WombatResponse> {
  constructor(private readonly config: FetcherConfig = fetcherConfig) {
    super(WombatFetcher.name);
  }

  override async makeRequest(assetId: SupportedIds): Promise<WombatResponse> {
    const { pairedToken, baseToken, quoteToken } = this.config.tokens[assetId];

    const baseTokenScaler = new MathUtils.PrecisionScaler(baseToken.decimals);
    const quoteTokenScaler = new MathUtils.PrecisionScaler(quoteToken.decimals);
    const amountInBaseToken = tryConvertUsdToTokenAmount(
      assetId,
      DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE
    );

    const amountInQuoteToken = convertUsdToTokenAmount(
      pairedToken ?? quoteToken.symbol,
      DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE
    );

    const multicallHandler = new MultiCallHandler(
      this.config.tokens[assetId],
      amountInBaseToken,
      amountInQuoteToken
    );

    const response = await RedstoneCommon.callMulticall(
      this.config.provider,
      multicallHandler.buildRequest()
    );

    return multicallHandler.parseResponse(response);
  }

  override calculateSpotPrice(
    dataFeedId: string,
    response: WombatResponse
  ): string {
    const { pairedToken, quoteToken } = this.config.tokens[dataFeedId];
    const { spotPrice } = response;

    const pairedTokenPrice = getLastPriceOrFail(
      pairedToken ?? quoteToken.symbol
    ).value;

    return spotPrice.mul(pairedTokenPrice).toString();
  }

  override calculateLiquidity(
    _assetId: string,
    _response: WombatResponse
  ): undefined {
    return undefined;
  }

  override calculateSlippage(
    _assetId: string,
    response: WombatResponse
  ): RedstoneTypes.SlippageData[] {
    const { buySlippage, sellSlippage } = response;

    if (!buySlippage || !sellSlippage) {
      return [];
    }

    return [
      {
        direction: RedstoneTypes.TradeDirection.BUY,
        slippageAsPercent: buySlippage,
        simulationValueInUsd: DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE.toString(),
      },
      {
        direction: RedstoneTypes.TradeDirection.SELL,
        slippageAsPercent: sellSlippage,
        simulationValueInUsd: DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE.toString(),
      },
    ];
  }
}

class MultiCallHandler {
  private readonly baseTokenScaler: MathUtils.PrecisionScaler;
  private readonly quoteTokenScaler: MathUtils.PrecisionScaler;

  constructor(
    private readonly poolConfig: PoolConfig,
    private readonly amountInBaseToken: string | undefined,
    private readonly amountInQuoteToken: string
  ) {
    this.baseTokenScaler = new MathUtils.PrecisionScaler(
      poolConfig.baseToken.decimals
    );
    this.quoteTokenScaler = new MathUtils.PrecisionScaler(
      poolConfig.quoteToken.decimals
    );
  }

  buildRequest(): ContractCallContext {
    const spotParams = [
      this.poolConfig.quoteToken.address,
      this.poolConfig.baseToken.address,
      this.quoteTokenScaler.tokenDecimalsScaler.toString(), // swap 1 of quote token for spot price calculation
    ];
    const swapMethod = "quotePotentialSwap";
    const calls = [
      RedstoneCommon.prepareCall(SPOT_PRICE_LABEL, swapMethod, spotParams),
    ];
    if (this.amountInBaseToken) {
      const buyParams = [
        this.poolConfig.quoteToken.address,
        this.poolConfig.baseToken.address,
        this.amountInQuoteToken,
      ];
      const sellParams = [
        this.poolConfig.baseToken.address,
        this.poolConfig.quoteToken.address,
        this.amountInBaseToken,
      ];
      calls.push(
        RedstoneCommon.prepareCall(SLIPPAGE_BUY_LABEL, swapMethod, buyParams),
        RedstoneCommon.prepareCall(SLIPPAGE_SELL_LABEL, swapMethod, sellParams)
      );
    }
    return RedstoneCommon.prepareContractCall(
      ROUTER_LABEL,
      this.poolConfig.poolAddress,
      WOMBAT_POOL_ABI,
      calls
    );
  }

  private static getPrice(
    subTokensIn: BigNumberish,
    subTokensOut: BigNumberish,
    tokensInScaler: MathUtils.PrecisionScaler,
    tokensOutScaler: MathUtils.PrecisionScaler
  ) {
    const tokensIn = tokensInScaler.fromSolidityValue(subTokensIn);
    const tokensOut = tokensOutScaler.fromSolidityValue(subTokensOut);
    return tokensIn.div(tokensOut);
  }

  parseResponse(
    multicallResponse: RedstoneCommon.MulticallResult
  ): WombatResponse {
    const spotPrice = MultiCallHandler.getPrice(
      multicallResponse.getCallParam(ROUTER_LABEL, SPOT_PRICE_LABEL, 2),
      multicallResponse.getResult(ROUTER_LABEL, SPOT_PRICE_LABEL, 0),
      this.quoteTokenScaler,
      this.baseTokenScaler
    );

    if (!this.amountInBaseToken) {
      this.poolConfig.pairedToken;
      return { spotPrice };
    }

    const slippageBuyPrice = MultiCallHandler.getPrice(
      multicallResponse.getCallParam(ROUTER_LABEL, SLIPPAGE_BUY_LABEL, 2),
      multicallResponse.getResult(ROUTER_LABEL, SLIPPAGE_BUY_LABEL, 0),
      this.quoteTokenScaler,
      this.baseTokenScaler
    );

    const slippageSellPrice = MultiCallHandler.getPrice(
      multicallResponse.getCallParam(ROUTER_LABEL, SLIPPAGE_SELL_LABEL, 2),
      multicallResponse.getResult(ROUTER_LABEL, SLIPPAGE_SELL_LABEL, 0),
      this.baseTokenScaler,
      this.quoteTokenScaler
    );

    const buySlippage = calculateSlippage(spotPrice, slippageBuyPrice);
    const sellSlippage = calculateSlippage(
      new Decimal(1).div(spotPrice),
      slippageSellPrice
    );

    return {
      spotPrice,
      buySlippage,
      sellSlippage,
    };
  }
}
