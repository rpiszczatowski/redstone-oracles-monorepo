import Decimal from "decimal.js";
import { BigNumber, Contract, providers } from "ethers";
import { RedstoneTypes, MathUtils } from "@redstone-finance/utils";
import { getLastPrice } from "../../db/local-db";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import {
  calculateSlippage,
  convertUsdToTokenAmount,
  DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE,
  tryConvertUsdToTokenAmount,
} from "../SlippageAndLiquidityCommons";
import abi from "./UniswapV2.abi.json";

export interface PoolsConfig {
  [symbol: string]: {
    address: string;
    symbol0: string;
    symbol0Decimals: number;
    symbol1: string;
    symbol1Decimals: number;
    pairedToken: string;
  };
}

interface UniswapV2LikeResponse {
  reserve0Scaled: Decimal;
  reserve1Scaled: Decimal;
  pairedTokenPrice: number;
  isSymbol0CurrentAsset: boolean;
}

export class UniswapV2LikeFetcher extends DexOnChainFetcher<UniswapV2LikeResponse> {
  protected override retryForInvalidResponse: boolean = true;

  constructor(
    name: string,
    protected readonly poolsConfig: PoolsConfig,
    protected readonly provider: providers.Provider
  ) {
    super(name);
  }

  override async makeRequest(
    spotAssetId: string
  ): Promise<UniswapV2LikeResponse> {
    const uniswapV2Pair = new Contract(
      this.poolsConfig[spotAssetId].address,
      abi,
      this.provider
    );

    const { _reserve0, _reserve1 } = await uniswapV2Pair.getReserves();

    return this.parseResponse(spotAssetId, _reserve0, _reserve1);
  }
  override calculateSpotPrice(
    assetId: string,
    response: UniswapV2LikeResponse
  ): string {
    const {
      isSymbol0CurrentAsset,
      reserve0Scaled,
      reserve1Scaled,
      pairedTokenPrice,
    } = response;

    const balanceRatio = isSymbol0CurrentAsset
      ? reserve1Scaled.div(reserve0Scaled)
      : reserve0Scaled.div(reserve1Scaled);

    return balanceRatio.mul(pairedTokenPrice).toString();
  }

  override calculateLiquidity(
    assetId: string,
    response: UniswapV2LikeResponse
  ): string {
    const {
      isSymbol0CurrentAsset,
      reserve0Scaled,
      reserve1Scaled,
      pairedTokenPrice,
    } = response;

    const reserve = isSymbol0CurrentAsset ? reserve1Scaled : reserve0Scaled;

    return reserve.mul(2).mul(pairedTokenPrice).toString();
  }
  override calculateSlippage(
    assetId: string,
    response: UniswapV2LikeResponse
  ): RedstoneTypes.SlippageData[] {
    const { symbol0Decimals, symbol1Decimals, pairedToken } =
      this.poolsConfig[assetId];
    const reserve0Scaler = new MathUtils.PrecisionScaler(symbol0Decimals);
    const reserve1Scaler = new MathUtils.PrecisionScaler(symbol1Decimals);
    const currentTokenScaler = response.isSymbol0CurrentAsset
      ? reserve0Scaler
      : reserve1Scaler;
    const pairedTokenScaler = response.isSymbol0CurrentAsset
      ? reserve1Scaler
      : reserve0Scaler;

    // sell slippage
    const currentAssetTokensAmount = tryConvertUsdToTokenAmount(
      assetId,
      10 ** currentTokenScaler.tokenDecimals,
      DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE
    );
    if (!currentAssetTokensAmount) {
      return [];
    }

    const lowAmountSell = this.getToken0SwapPrice(
      response.reserve0Scaled,
      response.reserve1Scaled,
      new Decimal(1)
    );
    const highAmountSell = this.getToken0SwapPrice(
      response.reserve0Scaled,
      response.reserve1Scaled,
      currentTokenScaler.fromSolidityValue(currentAssetTokensAmount)
    );

    // buy slippage
    const pairedTokenTokensAmount = convertUsdToTokenAmount(
      pairedToken,
      10 ** pairedTokenScaler.tokenDecimals,
      DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE
    );
    const lowAmountBuy = this.getToken1SwapPrice(
      response.reserve0Scaled,
      response.reserve1Scaled,
      new Decimal(1)
    );
    const highAmountBuy = this.getToken1SwapPrice(
      response.reserve0Scaled,
      response.reserve1Scaled,
      pairedTokenScaler.fromSolidityValue(pairedTokenTokensAmount)
    );

    return [
      {
        direction: RedstoneTypes.TradeDirection.BUY,
        slippageAsPercent: calculateSlippage(lowAmountBuy, highAmountBuy),
        simulationValueInUsd: DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE.toString(),
      },
      {
        direction: RedstoneTypes.TradeDirection.SELL,
        slippageAsPercent: calculateSlippage(lowAmountSell, highAmountSell),
        simulationValueInUsd: DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE.toString(),
      },
    ];
  }

  // token1Amount_received = reserve_1 -(reserve_0 * reserve_1)/(reserve_0 + token0Amount)
  // token0Amount/ token1Amount_received
  private getToken0SwapPrice(
    reserve0Scaled: Decimal,
    reserve1Scaled: Decimal,
    token0Amount: Decimal
  ) {
    const token1AmountReceived = reserve1Scaled.sub(
      reserve0Scaled.mul(reserve1Scaled).div(reserve0Scaled.add(token0Amount))
    );
    return token0Amount.div(token1AmountReceived);
  }

  // token0Amount_received = reserve_0 - (reserve_0 * reserve_1) / (reserve_1 + token1Amount)
  // token1Amount / token0AmountReceived
  private getToken1SwapPrice(
    reserve0Scaled: Decimal,
    reserve1Scaled: Decimal,
    token1Amount: Decimal
  ) {
    const token0AmountReceived = reserve0Scaled.sub(
      reserve0Scaled.mul(reserve1Scaled).div(reserve1Scaled.add(token1Amount))
    );
    return token1Amount.div(token0AmountReceived);
  }

  private parseResponse(
    assetId: string,
    reserve0: BigNumber,
    reserve1: BigNumber
  ): UniswapV2LikeResponse {
    const { symbol0Decimals, symbol1Decimals, symbol0, pairedToken } =
      this.poolsConfig[assetId];

    const reserve0Scaler = new MathUtils.PrecisionScaler(symbol0Decimals);
    const reserve1Scaler = new MathUtils.PrecisionScaler(symbol1Decimals);

    const reserve0Scaled = reserve0Scaler.fromSolidityValue(reserve0);
    const reserve1Scaled = reserve1Scaler.fromSolidityValue(reserve1);

    const pairedTokenPrice = getLastPrice(pairedToken);
    if (!pairedTokenPrice) {
      throw new Error(`Cannot get last price from cache for: ${pairedToken}`);
    }

    return {
      reserve0Scaled,
      reserve1Scaled,
      pairedTokenPrice: pairedTokenPrice.value,
      isSymbol0CurrentAsset: symbol0 === assetId,
    };
  }
}
