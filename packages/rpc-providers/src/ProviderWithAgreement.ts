import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { ErrorCode } from "@ethersproject/logger";
import { Deferrable } from "@ethersproject/properties";
import { JsonRpcProvider } from "@ethersproject/providers";
import {
  ProviderWithFallback,
  ProviderWithFallbackConfig,
} from "./ProviderWithFallback";
import { utils } from "ethers";

export interface ProviderWithAgreementConfig
  extends ProviderWithFallbackConfig {
  numberOfNodesWhichHaveToAgree: number;
}

const defaultConfig: Omit<
  ProviderWithAgreementConfig,
  keyof ProviderWithFallbackConfig
> = {
  numberOfNodesWhichHaveToAgree: 2,
};

export class ProviderWithAgreement extends ProviderWithFallback {
  private readonly multiProviderConfig: ProviderWithAgreementConfig;

  constructor(
    providers: JsonRpcProvider[],
    config: Partial<ProviderWithAgreementConfig> = {}
  ) {
    super(providers, config);
    this.multiProviderConfig = {
      ...defaultConfig,
      ...this.getProviderWithFallbackConfig(),
    };
  }

  override getBlockNumber(): Promise<number> {
    return this.electBlockNumber();
  }

  override async call(
    transaction: Deferrable<TransactionRequest>
  ): Promise<string> {
    const electedBlockTag = utils.hexlify(
      await this.electBlockNumber()
    ) as BlockTag;

    const promises = this.providers.map((provider) =>
      provider.call(transaction, electedBlockTag)
    );

    return this.resolveCallPromises(promises);
  }

  private async electBlockNumber(): Promise<number> {
    let lastError;
    const blockNumbers: number[] = [];

    // collect block numbers
    await Promise.all(
      this.providers.map((provider) =>
        provider
          .getBlockNumber()
          .then((blockNumber) => blockNumbers.push(blockNumber))
          .catch((error) => {
            lastError = error;
          })
      )
    );

    if (blockNumbers.length === 0) {
      this.multiProviderConfig.logger.warn(
        "Failed to getBlockNumber from at least one provider"
      );
      throw lastError;
    }

    if (blockNumbers.length === 1) {
      return blockNumbers[0];
    }

    return blockNumbers.sort((a, b) => a - b).at(1) as number;
  }

  private async resolveCallPromises(promises: Promise<any>[]) {
    const agreedResults: CallResult[] = [];
    let resolvedCalls = 0;

    while (true) {
      const { theFastestPromise, notResolvedPromises } = await smartPromiseRace(
        promises
      );

      const result = await theFastestPromise
        .then((data) => ({
          data,
          error: null,
        }))
        .catch<CallResult>((error: any) => {
          return { data: error.data || "", error: error as Error };
        });

      resolvedCalls += 1;
      promises = notResolvedPromises;

      this.handleCallResult(agreedResults, result);

      // we have found satisfying number of same responses
      if (
        agreedResults.length ===
        this.multiProviderConfig.numberOfNodesWhichHaveToAgree
      ) {
        return result.data;
      }

      // we have checked all promises and didn't get result so we exit with error
      if (resolvedCalls === promises.length) {
        this.multiProviderConfig.logger.warn(
          "All providers failed to execute call."
        );

        throw Error(
          `Failed to find at least ${this.multiProviderConfig.numberOfNodesWhichHaveToAgree} agreeing providers.`
        );
      }
    }
  }

  private handleCallResult(
    agreedResults: CallResult[],
    result: CallResult | { data: string; error: Error | null }
  ) {
    const lastResult = agreedResults.at(-1)!;

    if (lastResult) {
      if (cmpCallResult(lastResult, result)) {
        agreedResults.push(result);
      }
    } else {
      agreedResults.push(result);
    }
  }
}

type CallResult = {
  data: string;
  error: (Error & { code?: ErrorCode }) | null;
};

function cmpCallResult(a: CallResult, b: CallResult): boolean {
  if (a.error || b.error) {
    return false;
  }

  return a.data === b.data;
}

/** Only difference from Promise.race is that it replace resolved promises if undefined */
function smartPromiseRace<T>(promises: Promise<T>[]): {
  theFastestPromise: Promise<T>;
  notResolvedPromises: Promise<T>[];
} {
  let newPromises = [...promises];
  const result = new Promise<T>((resolve, reject) => {
    for (const promise of newPromises.filter((p) => !!p)) {
      promise
        .then((result) => {
          filterInPlace(newPromises, (p) => p !== promise);
          resolve(result);
        })
        .catch((error) => {
          filterInPlace(newPromises, (p) => p !== promise);
          reject(error);
        });
    }
  });

  return { notResolvedPromises: newPromises, theFastestPromise: result };
}

function filterInPlace<T>(
  arr: T[],
  condition: (elem: T, i: number, arr: T[]) => boolean
) {
  for (let i = 0; i < arr.length; i++) {
    if (!condition(arr[i], i, arr)) {
      delete arr[i];
    }
  }

  return arr;
}
