import Decimal from "decimal.js";
import { BigNumber, BigNumberish, Contract, providers } from "ethers";
import { MathUtils, RedstoneCommon } from "redstone-utils";
import { SlippageData } from "redstone-utils/src/types";
import { getRawPrice } from "../../db/local-db";
import {
  DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE,
  calculateSlippage,
  convertUsdToTokenAmount,
  tryConvertUsdToTokenAmount,
} from "../SlippageAndLiquidityCommons";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import fetcherConfig from "./maverick-fetcher-config";
import { MAVERICK_POOL_INFORMATION_ABI } from "./pool-information.abi";

const MAVERICK_PRECISION = new Decimal(1e18);
const ONE_AS_DECIMAL = new Decimal(1);

interface FetcherConfig {
  poolInformationAddress: string;
  provider: providers.Provider;
  tokens: {
    [dataFeedId: string]: TokenConfig;
  };
}
interface TokenConfig {
  token0Symbol: string;
  token1Symbol: string;
  token0Decimals: number;
  token1Decimals: number;
  pairedToken: string;
  poolAddress: string;
}
type SupportedIds = keyof (typeof fetcherConfig)["tokens"];

export interface MaverickResponse {
  price: Decimal;
  smallSellAmountOutScaled?: Decimal;
  smallBuyAmountOutScaled?: Decimal;
  bigSellAmountOutScaled?: Decimal;
  bigBuyAmountOutScaled?: Decimal;
}

export class MaverickFetcher extends DexOnChainFetcher<MaverickResponse> {
  constructor(private readonly config: FetcherConfig = fetcherConfig) {
    super(MaverickFetcher.name);
  }

  override async makeRequest(assetId: SupportedIds): Promise<MaverickResponse> {
    const { pairedToken, token0Decimals, token1Decimals } =
      this.config.tokens[assetId];

    const contract = new Contract(
      this.config.poolInformationAddress,
      MAVERICK_POOL_INFORMATION_ABI,
      this.config.provider
    );

    const amountIn0Token = tryConvertUsdToTokenAmount(
      assetId,
      token0Decimals,
      DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE
    );

    const amountIn1Token = convertUsdToTokenAmount(
      pairedToken,
      token1Decimals,
      DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE
    );

    const multicallHandler = new MultiCallHandler(
      this.config.tokens[assetId],
      amountIn0Token,
      amountIn1Token
    );

    const response = await RedstoneCommon.multiCallOneContract(
      contract,
      multicallHandler.buildRequest()
    );

    return await multicallHandler.parseResponse(response);
  }

  override calculateSpotPrice(
    dataFeedId: string,
    response: MaverickResponse
  ): number {
    const { pairedToken } = this.config.tokens[dataFeedId];
    const { price } = response;

    const pairedTokenPrice = this.getPairedTokenPrice(pairedToken);

    const isCurrentDataFeedToken0 =
      this.config.tokens[dataFeedId].token0Symbol === dataFeedId;

    let priceInPairedTokenSerialized = price;
    if (!isCurrentDataFeedToken0) {
      priceInPairedTokenSerialized = ONE_AS_DECIMAL.div(
        priceInPairedTokenSerialized
      );
    }

    return priceInPairedTokenSerialized.mul(pairedTokenPrice).toNumber();
  }

  override calculateLiquidity(
    _assetId: string,
    _response: MaverickResponse
  ): string | number | undefined {
    return undefined;
  }

  override calculateSlippage(
    assetId: string,
    response: MaverickResponse
  ): SlippageData[] {
    const {
      smallSellAmountOutScaled,
      smallBuyAmountOutScaled,
      bigSellAmountOutScaled,
      bigBuyAmountOutScaled,
    } = response;

    if (
      !smallBuyAmountOutScaled ||
      !smallSellAmountOutScaled ||
      !bigBuyAmountOutScaled ||
      !bigSellAmountOutScaled
    ) {
      return [];
    }

    const buySlippage = calculateSlippage(
      smallBuyAmountOutScaled,
      bigBuyAmountOutScaled
    );

    const sellSlippage = calculateSlippage(
      smallSellAmountOutScaled,
      bigSellAmountOutScaled
    );

    return [
      {
        direction: "buy",
        slippageAsPercent: buySlippage,
        simulationValueInUsd: DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE.toString(),
      },
      {
        direction: "sell",
        slippageAsPercent: sellSlippage,
        simulationValueInUsd: DEFAULT_AMOUNT_IN_USD_FOR_SLIPPAGE.toString(),
      },
    ];
  }

  protected getPairedTokenPrice(tokenSymbol: string): Decimal {
    const lastPriceFromCache = getRawPrice(tokenSymbol);
    if (!lastPriceFromCache) {
      throw new Error(`Cannot get last price from cache for: ${tokenSymbol}`);
    }
    return new Decimal(lastPriceFromCache.value);
  }
}

class MultiCallHandler {
  private readonly token0Scaler: MathUtils.PrecisionScaler;
  private readonly token1Scaler: MathUtils.PrecisionScaler;

  constructor(
    private readonly tokenConfig: TokenConfig,
    private readonly amountIn0Token: string | undefined,
    private readonly amountIn1Token: string
  ) {
    this.token0Scaler = new MathUtils.PrecisionScaler(
      tokenConfig.token0Decimals
    );
    this.token1Scaler = new MathUtils.PrecisionScaler(
      tokenConfig.token1Decimals
    );
  }

  buildRequest(): RedstoneCommon.CallParams[] {
    const requests: RedstoneCommon.CallParams[] = [
      { function: "getSqrtPrice", params: [this.tokenConfig.poolAddress] },
    ];

    if (this.amountIn0Token) {
      requests.push(
        {
          /// @notice calculate swap tokens
          /// @param pool to swap against
          /// @param amount amount of token that is either the input if exactOutput
          //is false or the output if exactOutput is true
          /// @param tokenAIn bool indicating whether tokenA is the input
          /// @param exactOutput bool indicating whether the amount specified is the
          //exact output amount (true)
          /// @param sqrtPriceLimit limiting sqrt price of the swap.  A value of 0
          //indicates no limit.  Limit is only engaged for exactOutput=false.  If the
          //limit is reached only part of the input amount will be swapped and the
          //callback will only require that amount of the swap to be paid.
          function: "calculateSwap",
          params: [
            this.tokenConfig.poolAddress,
            this.token0Scaler.toSolidityValue(1),
            true,
            false,
            0,
          ],
        },
        {
          function: "calculateSwap",
          params: [
            this.tokenConfig.poolAddress,
            this.token1Scaler.toSolidityValue(1),
            false,
            false,
            0,
          ],
        },
        {
          function: "calculateSwap",
          params: [
            this.tokenConfig.poolAddress,
            this.token0Scaler.toSolidityValue(this.amountIn0Token),
            true,
            false,
            0,
          ],
        },
        {
          function: "calculateSwap",
          params: [
            this.tokenConfig.poolAddress,
            this.token1Scaler.toSolidityValue(this.amountIn1Token),
            false,
            false,
            0,
          ],
        }
      );
    }

    return requests;
  }

  parseResponse(multicallResponse: BigNumberish[]) {
    const [sqrtPrice, ...slippageResponses] = multicallResponse;
    const price = new Decimal(BigNumber.from(sqrtPrice).toHexString())
      .div(MAVERICK_PRECISION)
      .toPower(2);

    if (!this.amountIn0Token) {
      return { price };
    }

    const [
      smallSellAmountOut, // token1
      smallBuyAmountOut, // token0
      bigSellAmountOut, // token0
      bigBuyAmountOut, // token1
    ] = slippageResponses;

    const smallSellAmountOutScaled =
      this.token1Scaler.fromSolidityValue(smallSellAmountOut);
    const smallBuyAmountOutScaled =
      this.token0Scaler.fromSolidityValue(smallBuyAmountOut);
    const bigSellAmountOutScaled = this.token1Scaler
      .fromSolidityValue(bigSellAmountOut)
      .div(this.amountIn0Token);
    const bigBuyAmountOutScaled = this.token0Scaler
      .fromSolidityValue(bigBuyAmountOut)
      .div(this.amountIn1Token);

    return {
      price,
      smallSellAmountOutScaled,
      smallBuyAmountOutScaled,
      bigSellAmountOutScaled,
      bigBuyAmountOutScaled,
    };
  }
}
