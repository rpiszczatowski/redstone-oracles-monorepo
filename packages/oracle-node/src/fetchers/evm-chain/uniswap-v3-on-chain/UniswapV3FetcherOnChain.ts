import { DexOnChainFetcher } from "../../dex-on-chain/DexOnChainFetcher";
import { BigNumber, providers } from "ethers";
import UniswapV3Quoter from "./UniswapV3Quoter.abi.json";
import UniswapV3Pool from "./UniswapV3Pool.abi.json";
import { ethers } from "ethers";
import { getLastPrice } from "../../../db/local-db";
import { PoolsConfig, QuoterOutAmount, QuoterParams } from "./types";
import {
  Multicall,
  ContractCallResults,
  ContractCallContext,
} from "ethereum-multicall";

import { isLiquidity } from "../../liquidity/utils";

const DOLLAR_IN_CENTS = 100;
const DOLLAR_IN_CENTS_EXPONENT = 2;
const SPOT_PRICE_PRECISION = 10000;

export class UniswapV3FetcherOnChain extends DexOnChainFetcher<QuoterOutAmount> {
  constructor(
    name: string,
    private readonly poolsConfig: PoolsConfig,
    private readonly provider: providers.JsonRpcProvider
  ) {
    super(name);
  }

  async makeRequest(id: string): Promise<QuoterOutAmount | null> {
    let assetId = id;
    if (isLiquidity(id)) {
      return null;
    }
    const { quoterParams, outAssetId, outAssetDecimals, inAssetDecimals } =
      this.buildParamsForQuoter(
        this.poolsConfig[assetId].token0Address,
        this.poolsConfig[assetId].token1Address,
        assetId
      );
    const multicall = this.createMulticallInstance();
    const contractCallContext = this.buildContractCallContext(
      assetId,
      quoterParams
    );
    const results: ContractCallResults = await multicall.call(
      contractCallContext
    );

    return this.extractQuoterOutput(
      results,
      id,
      outAssetId,
      outAssetDecimals,
      inAssetDecimals
    );
  }

  override calculateSpotPrice(
    assetId: string,
    quoterResponse: QuoterOutAmount
  ) {
    const outAssetLastPrice = this.getLastPriceOrThrow(
      quoterResponse.outAssetId
    );
    const outAssetDecimalsExp = this.calculateOutAssetDecimalsExp(
      quoterResponse.outAssetDecimals
    );
    const outAssetPriceInCents =
      this.calculateOutAssetPriceInCents(outAssetLastPrice);

    const spotPriceInDollars = quoterResponse.amountOut
      .mul(outAssetPriceInCents)
      .div(outAssetDecimalsExp);

    return spotPriceInDollars.toNumber() / SPOT_PRICE_PRECISION;
  }

  override calculateLiquidity(
    assetId: string,
    response: QuoterOutAmount
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
  private calculateOutAssetDecimalsExp(outAssetDecimals: number) {
    return BigNumber.from(10).pow(
      BigNumber.from(outAssetDecimals - DOLLAR_IN_CENTS_EXPONENT)
    );
  }

  private calculateOutAssetPriceInCents(outAssetLastPrice: number) {
    return BigNumber.from(outAssetLastPrice * DOLLAR_IN_CENTS);
  }

  private createMulticallInstance() {
    return new Multicall({
      ethersProvider: this.provider,
      tryAggregate: true,
    });
  }

  private buildContractCallContext(
    assetId: string,
    quoterParams: QuoterParams
  ): ContractCallContext[] {
    return [
      {
        reference: "quoterContract",
        contractAddress: this.poolsConfig[assetId].quoterAddress,
        abi: UniswapV3Quoter.abi,
        calls: [
          {
            reference: "quoteExactInputSingleCall",
            methodName: "quoteExactInputSingle",
            methodParameters: [quoterParams],
          },
        ],
      },
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
        ],
      },
    ];
  }

  private extractQuoterOutput(
    results: ContractCallResults,
    id: string,
    outAssetId: string,
    outAssetDecimals: number,
    inAssetDecimals: number
  ): QuoterOutAmount {
    const amountOut = BigNumber.from(
      results.results.quoterContract.callsReturnContext[0].returnValues[0]
    );
    const liquidity = BigNumber.from(
      results.results.poolContract.callsReturnContext[0]
        .returnValues[0] as BigNumber
    );

    return {
      amountOut,
      assetId: id,
      outAssetId,
      outAssetDecimals,
      inAssetDecimals,
      liquidity,
    };
  }

  private buildParamsForQuoter(
    token0Address: string,
    token1Address: string,
    assetId: string
  ) {
    return {
      quoterParams: {
        tokenIn: token0Address,
        tokenOut: token1Address,
        amountIn: ethers.utils
          .parseUnits("1", this.poolsConfig[assetId].token0Decimals)
          .toString(),
        fee: this.poolsConfig[assetId].fee,
        sqrtPriceLimitX96: 0,
      },
      outAssetId: this.poolsConfig[assetId].token1Symbol,
      outAssetDecimals: this.poolsConfig[assetId].token1Decimals,
      inAssetDecimals: this.poolsConfig[assetId].token0Decimals,
    };
  }
}
