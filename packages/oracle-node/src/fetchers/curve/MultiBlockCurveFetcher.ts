import { utils } from "ethers";
import { getMedianBigNumber } from "../../utils/numbers";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import { CurveFetcher, CurveFetcherResponse } from "./CurveFetcher";

export class MultiBlockCurveFetcher extends DexOnChainFetcher<CurveFetcherResponse> {
  constructor(name: string, private readonly curveFetcher: CurveFetcher) {
    super(name);
  }

  async makeRequest(assetId: string): Promise<CurveFetcherResponse> {
    const { provider, multiBlockConfig } =
      this.curveFetcher.getPoolConfig()[assetId];
    const currentBlockNumber = await provider.getBlockNumber();
    const blockSequence = this.getBlocksSequence(
      currentBlockNumber,
      multiBlockConfig.sequenceLength,
      multiBlockConfig.sequenceStep
    );

    const responsePerBlock = await Promise.all(
      blockSequence.map((blockTag) =>
        this.curveFetcher.makeRequest(assetId, blockTag)
      )
    );

    const ratios = responsePerBlock.map((r) => r.ratio);

    return {
      ratio: getMedianBigNumber(ratios),
      assetId: assetId,
    };
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
    const blocks = [];
    for (
      let i = lastBlock;
      i > lastBlock - sequenceLength * sequenceStep;
      i -= sequenceStep
    ) {
      blocks.push(i);
    }
    return blocks;
  }
}
