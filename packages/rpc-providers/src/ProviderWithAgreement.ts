import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";
import { JsonRpcProvider } from "@ethersproject/providers";
import { utils } from "ethers";
import { timeout } from "./common";
import {
  ProviderWithFallback,
  ProviderWithFallbackConfig,
} from "./ProviderWithFallback";

export interface ProviderWithAgreementConfig
  extends ProviderWithFallbackConfig {
  numberOfProvidersWhichHaveToAgree: number;
  getBlockNumberTimeoutMS: number;
  electBlockFn: (blocks: number[], numberOfAgreeingNodes: number) => number;
}

const DEFAULT_ELECT_BLOCK_FN = (
  blockNumbers: number[],
  numberOfProviders: number
): number => {
  if (blockNumbers.length === 1) {
    return blockNumbers[0];
  }

  return blockNumbers
    .sort((a, b) => a - b)
    .at(Math.floor(numberOfProviders / 3)) as number;
};

const defaultConfig: Omit<
  ProviderWithAgreementConfig,
  keyof ProviderWithFallbackConfig
> = {
  numberOfProvidersWhichHaveToAgree: 2,
  getBlockNumberTimeoutMS: 5_000,
  electBlockFn: DEFAULT_ELECT_BLOCK_FN,
};

export class ProviderWithAgreement extends ProviderWithFallback {
  private readonly agreementConfig: ProviderWithAgreementConfig;

  constructor(
    providers: JsonRpcProvider[],
    config: Partial<ProviderWithAgreementConfig> = {}
  ) {
    super(providers, config);
    this.agreementConfig = {
      ...defaultConfig,
      ...this.getProviderWithFallbackConfig(),
    };
    if (
      this.agreementConfig.numberOfProvidersWhichHaveToAgree < 2 ||
      this.agreementConfig.numberOfProvidersWhichHaveToAgree >
        this.providers.length
    ) {
      throw new Error(
        "numberOfProvidersWhichHaveToAgree should be >= 2 and > then supplied providers count"
      );
    }
  }

  override getBlockNumber(): Promise<number> {
    return this.electBlockNumber();
  }

  override async call(
    transaction: Deferrable<TransactionRequest>,
    blockTag?: BlockTag
  ): Promise<string> {
    const electedBlockTag = utils.hexlify(
      blockTag ?? (await this.electBlockNumber())
    ) as BlockTag;

    const promises = this.providers.map((provider) =>
      provider.call(transaction, electedBlockTag)
    );

    return this.resolveCallPromises(promises);
  }

  private async electBlockNumber(): Promise<number> {
    // collect block numbers
    const blockNumbersResults = await Promise.allSettled(
      this.providers.map((provider) =>
        timeout(
          provider.getBlockNumber(),
          this.agreementConfig.getBlockNumberTimeoutMS
        )
      )
    );

    const blockNumbers = blockNumbersResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => (result as PromiseFulfilledResult<number>).value);

    if (blockNumbers.length === 0) {
      throw new AggregateError(
        "Failed to getBlockNumber from at least one provider"
      );
    }

    return this.agreementConfig.electBlockFn(
      blockNumbers,
      this.providers.length
    );
  }

  private resolveCallPromises(callPromises: Promise<string>[]) {
    return new Promise<string>((resolve, reject) => {
      const errors: Error[] = [];
      const results = new Map<string, number>();
      let handledResults = 0;

      for (const callPromise of callPromises) {
        callPromise
          .then((currentResult) => {
            const currentResultCount = results.get(currentResult);

            // we have found satisfying number of same responses
            if (currentResultCount) {
              results.set(currentResult, currentResultCount + 1);
              if (
                currentResultCount + 1 ===
                this.agreementConfig.numberOfProvidersWhichHaveToAgree
              ) {
                resolve(currentResult);
              }
            } else {
              results.set(currentResult, 1);
            }
          })
          .catch((e) => errors.push(e))
          .finally(() => {
            handledResults += 1;
            if (handledResults === callPromises.length) {
              reject(
                new AggregateError(
                  errors,
                  `Failed to find at least ${this.agreementConfig.numberOfProvidersWhichHaveToAgree} agreeing providers.`
                )
              );
            }
          });
      }
    });
  }
}
