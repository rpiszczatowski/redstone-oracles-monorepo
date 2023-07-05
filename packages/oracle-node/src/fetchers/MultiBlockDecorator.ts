import { providers } from "ethers";
import { Fetcher, FetcherOpts, PriceDataFetched } from "../types";
import { terminateWithManifestConfigError } from "../Terminator";
import { MathUtils, SafeNumber } from "redstone-utils";

export type Class<T> = {
  new (...args: any[]): T;
};

export type MultiBlockConfig = {
  sequenceStep: number;
  intervalLength: number;
};

export function decorateWithMultiBlock<T extends Fetcher>(
  fetcherClass: Class<Fetcher>,
  provider: providers.Provider,
  multiblockConfig: MultiBlockConfig
) {
  const FetcherDecoratedWithMultiBlock = class FetcherWithMultiBlock extends fetcherClass {
    constructor(...args: any[]) {
      super(...args);
      if (!fetcherClass.prototype.fetchAll) {
        throw new Error(
          `Can not decorate ${fetcherClass.name} with MultiBlock because it doesn't implement Fetcher interface`
        );
      }
    }

    async fetchAll(
      tokens: string[],
      opts?: FetcherOpts
    ): Promise<PriceDataFetched[]> {
      const currentBlockNumber = Number(
        opts?.blockTag ?? (await provider.getBlockNumber())
      );
      const blockSequence = generateRoundedStepSequence(
        currentBlockNumber,
        multiblockConfig.intervalLength,
        multiblockConfig.sequenceStep
      );

      const responsePerBlock = (await Promise.all(
        blockSequence.map((blockTag) =>
          fetcherClass.prototype.fetchAll.call(this, tokens, {
            ...opts,
            blockTag,
          })
        )
      )) as PriceDataFetched[][];

      const groupedByToken: Record<string, SafeNumber.ISafeNumber[]> = {};

      for (const response of responsePerBlock) {
        for (const token of response) {
          if (!groupedByToken[token.symbol]) {
            groupedByToken[token.symbol] = [];
          }
          // if single value will be invalid we fail fast
          groupedByToken[token.symbol].push(
            SafeNumber.createSafeNumber(token.value)
          );
        }
      }

      return Object.entries(groupedByToken).map(([symbol, values]) => ({
        symbol,
        value: SafeNumber.getMedian(values),
      }));
    }
  };

  return FetcherDecoratedWithMultiBlock;
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
