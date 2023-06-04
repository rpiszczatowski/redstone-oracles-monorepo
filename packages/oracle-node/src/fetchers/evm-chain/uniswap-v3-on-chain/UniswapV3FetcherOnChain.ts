import { DexOnChainFetcher } from "../../dex-on-chain/DexOnChainFetcher";
import { BigNumber, providers } from "ethers";
import UniswapV3Pool from "./UniswapV3Pool.abi.json";
import { getLastPrice } from "../../../db/local-db";
import { ObserveParams, ObserveResult, PoolsConfig } from "./types";
import { Multicall, ContractCallContext } from "ethereum-multicall";
import { Decimal } from "decimal.js";
import { TEN_AS_BASE_OF_POWER } from "../shared/contants";

export class UniswapV3FetcherOnChain extends DexOnChainFetcher<ObserveResult> {
  constructor(
    name: string,
    private readonly poolsConfig: PoolsConfig,
    private readonly provider: providers.JsonRpcProvider
  ) {
    super(name);
  }

  SINGLE_TICK = 1.0001;

  async makeRequest(assetId: string): Promise<ObserveResult | null> {
    const secondsAgoStart = 180; // fetch 2 data points: 3 minutes ago and the current one
    const secondsAgoEnd = 0;
    const multicallContext = this.buildContractCallContext(assetId, {
      secondsAgoStart,
      secondsAgoEnd,
    });
    const multicallResult = await this.createMulticallInstance().call(
      multicallContext
    );
    const poolConfig = this.poolsConfig[assetId];

    // TODO how to convert this to something meaningful?
    const liquidity = BigNumber.from(
      multicallResult.results.poolContract.callsReturnContext[0].returnValues[0]
    );

    const tickCumulatives: BigNumber[] =
      multicallResult.results.poolContract.callsReturnContext[1]
        .returnValues[0];
    // twapTick is defined as log(1.0001, token0_sub_units/token1_sub_units)
    const twapTick = BigNumber.from(tickCumulatives[1])
      .sub(tickCumulatives[0])
      .div(secondsAgoStart - secondsAgoEnd);
    const decimalsDifferenceMultiplier = new Decimal(TEN_AS_BASE_OF_POWER).toPower(
      poolConfig.token0Decimals - poolConfig.token1Decimals
    );
    const priceRatio = new Decimal(this.SINGLE_TICK)
      .toPower(twapTick.toNumber())
      .times(decimalsDifferenceMultiplier)
      .toNumber();

    const isSymbol1Current = poolConfig.token1Symbol === assetId;

    return {
      priceRatio: isSymbol1Current ? 1.0 / priceRatio : priceRatio,
      liquidity,
      pairedToken: poolConfig.pairedToken ? poolConfig.pairedToken : isSymbol1Current
        ? poolConfig.token0Symbol
        : poolConfig.token1Symbol,
    };
  }

  override calculateSpotPrice(assetId: string, observeResult: ObserveResult) {
    const otherAssetLastPrice = this.getLastPriceOrThrow(
      observeResult.pairedToken
    );
    return otherAssetLastPrice * observeResult.priceRatio;
  }

  override calculateLiquidity(
    _assetId: string,
    _observeResult: ObserveResult
  ): number {
    throw new Error("Method not implemented.");
  }

  private getLastPriceOrThrow(outAssetId: string) {
    const lastPrice = getLastPrice(outAssetId);
    if (lastPrice === undefined) {
      throw new Error(`Could not fetch last price for ${outAssetId} from DB`);
    }
    return lastPrice.value;
  }

  private createMulticallInstance() {
    return new Multicall({
      ethersProvider: this.provider,
      tryAggregate: true,
    });
  }

  private buildContractCallContext(
    assetId: string,
    observeParams: ObserveParams
  ): ContractCallContext[] {
    return [
      {
        reference: "poolContract",
        contractAddress: this.poolsConfig[assetId].poolAddress,
        abi: UniswapV3Pool.abi,
        calls: [
          {
            reference: "liquidityCall",
            methodName: "liquidity",
            methodParameters: [],
          },
          {
            reference: "observeCall",
            methodName: "observe",
            methodParameters: [
              [observeParams.secondsAgoStart, observeParams.secondsAgoEnd],
            ],
          },
        ],
      },
    ];
  }
}
