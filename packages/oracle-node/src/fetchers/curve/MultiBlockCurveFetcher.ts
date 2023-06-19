import { terminateWithManifestConfigError } from "../../Terminator";
import { getMedianOfDecimals } from "../../utils/numbers";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import { CurveFetcher, CurveFetcherResponse } from "./CurveFetcher";

export class MultiBlockCurveFetcher extends DexOnChainFetcher<CurveFetcherResponse> {
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
      multiBlockConfig.sequenceLength,
      multiBlockConfig.sequenceStep
    );

    const responsesPerBlock = await Promise.all(
      blockSequence.map((blockTag) =>
        this.curveFetcher.makeRequest(assetId, blockTag)
      )
    );

    const ratios = responsesPerBlock.map((response) => response.ratio);

    return {
      ratio: getMedianOfDecimals(ratios),
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
    sequenceLength: number,
    sequenceStep: number
  ): number[] {
    return generateRoundedStepSequence(lastBlock, sequenceLength, sequenceStep);
  }
}

export function generateRoundedStepSequence(
  start: number,
  sequenceLength: number,
  step: number
) {
  const sequence = [start];

  if (sequenceLength === 1) {
    return sequence;
  }

  const stepsCount = Math.ceil(sequenceLength / step);

  const scaledSecond = Math.floor((start - 1) / step) * step;
  sequence.push(scaledSecond);

  for (let i = 1; i < stepsCount - 1; i++) {
    const next = scaledSecond - i * step;
    sequence.push(next);
  }
  return sequence;
}
