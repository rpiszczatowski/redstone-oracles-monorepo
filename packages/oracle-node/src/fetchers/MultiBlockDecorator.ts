import { providers } from "ethers";
import { SafeNumber } from "redstone-utils";
import { FetcherOpts, PriceDataFetched } from "../types";
import { BaseFetcher } from "./BaseFetcher";

export type MultiBlockConfig = {
  sequenceStep: number;
  intervalLength: number;
};

export function decorateWithMultiBlock<T extends BaseFetcher>(
  fetcher: T,
  provider: providers.Provider,
  multiblockConfig: MultiBlockConfig
): T {
  const oldGetName = fetcher.getName.bind(fetcher);
  (fetcher as any).getName = () => {
    return `${oldGetName()}-multi-block`;
  };

  const oldFetchAll = fetcher.fetchAll.bind(fetcher);

  fetcher.fetchAll = async (
    tokens: string[],
    opts: FetcherOpts
  ): Promise<PriceDataFetched[]> => {
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
        oldFetchAll(tokens, {
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
        if (!token.value) {
          throw new Error(
            `MultiBlock: value for at least one of tokens is not defined. Missing token: ${token} blockTag ${opts.blockTag}`
          );
        }

        groupedByToken[token.symbol].push(
          SafeNumber.createSafeNumber(token.value)
        );
      }
    }

    return Object.entries(groupedByToken).map(([symbol, values]) => ({
      symbol,
      value: SafeNumber.getMedian(values).unsafeToNumber(),
    }));
  };

  return fetcher;
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
