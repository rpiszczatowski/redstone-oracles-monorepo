import { MathUtils } from "redstone-utils";
import { terminateWithManifestConfigError } from "../../Terminator";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import { CurveFetcher, CurveFetcherResponse } from "./CurveFetcher";
import Decimal from "decimal.js";

export class MultiBlockCurveFetcher extends DexOnChainFetcher<CurveFetcherResponse> {
  protected retryForInvalidResponse: boolean = true;

  constructor(name: string, private readonly curveFetcher: CurveFetcher) {
    super(name);
  }

  async makeRequest(assetId: string): Promise<CurveFetcherResponse> {
    const { provider, multiBlockConfig } =
      this.curveFetcher.poolsConfig[assetId];

    if (!multiBlockConfig) {
      terminateWithManifestConfigError(
        `${this.getName()} has not configured multi-block. In 'curve-fetchers-config'`
      );
    }

    const currentBlockNumber = await provider.getBlockNumber();
    const blockSequence = this.getBlocksSequence(
      currentBlockNumber,
      multiBlockConfig.intervalLength,
      multiBlockConfig.sequenceStep
    );

    const responsesPerBlock = await Promise.all(
      blockSequence.map((blockTag) =>
        this.curveFetcher.makeRequest(assetId, blockTag)
      )
    );

    const ratios = responsesPerBlock.map((response) => response.ratio);

    return {
      ratio: new Decimal(MathUtils.getMedian(ratios)),
      assetId: assetId,
    };
  }

  calculateSlippage(assetId: string, response: CurveFetcherResponse): number {
    return this.curveFetcher.calculateSlippage(assetId, response);
  }

  calculateLiquidity(assetId: string, response: CurveFetcherResponse): number {
    return this.curveFetcher.calculateLiquidity(assetId, response);
  }

  calculateSpotPrice(assetId: string, response: CurveFetcherResponse): number {
    return this.curveFetcher.calculateSpotPrice(assetId, response);
  }

  private getBlocksSequence(
    lastBlock: number,
    intervalLength: number,
    sequenceStep: number
  ): number[] {
    return generateRoundedStepSequence(lastBlock, intervalLength, sequenceStep);
  }
}

export function generateRoundedStepSequence(
  start: number,
  intervalLength: number,
  step: number
) {
  const sequence = [start];

  if (intervalLength === 1) {
    return sequence;
  }

  const stepsCount = Math.ceil(intervalLength / step);

  const scaledSecond = Math.floor((start - 1) / step) * step;
  sequence.push(scaledSecond);

  for (let i = 1; i < stepsCount - 1; i++) {
    const next = scaledSecond - i * step;
    sequence.push(next);
  }
  return sequence;
}
