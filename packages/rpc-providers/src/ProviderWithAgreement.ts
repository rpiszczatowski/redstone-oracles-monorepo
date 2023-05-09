import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";
import { JsonRpcProvider } from "@ethersproject/providers";
import { utils } from "ethers";
import {
  ProviderWithFallback,
  ProviderWithFallbackConfig,
} from "./ProviderWithFallback";

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
    const blockNumbers: number[] = [];

    // collect block numbers
    const blockNumbersResults = await Promise.allSettled(
      this.providers.map((provider) => provider.getBlockNumber())
    );

    const errors = [];
    for (const blockNumberResult of blockNumbersResults) {
      if (blockNumberResult.status === "fulfilled") {
        blockNumbers.push(blockNumberResult.value);
      } else {
        errors.push(new Error(blockNumberResult.reason));
      }
    }

    if (blockNumbers.length === 0) {
      this.multiProviderConfig.logger.warn(
        "Failed to getBlockNumber from at least one provider"
      );
      throw new AggregateError(errors);
    }

    if (blockNumbers.length === 1) {
      return blockNumbers[0];
    }

    return blockNumbers.sort((a, b) => a - b).at(1) as number;
  }

  private resolveCallPromises(callPromises: Promise<string>[]) {
    return new Promise<string>((resolve, reject) => {
      const errors: Error[] = [];
      const agreedResults: string[] = [];
      let handledResults = 0;

      for (const callPromise of callPromises) {
        callPromise
          .then((currentResult) => {
            const lastResult = agreedResults.at(-1);
            if (lastResult && currentResult !== lastResult) {
              return;
            }
            agreedResults.push(currentResult);

            // we have found satisfying number of same responses
            if (
              agreedResults.length ===
              this.multiProviderConfig.numberOfNodesWhichHaveToAgree
            ) {
              resolve(currentResult);
            }
          })
          .catch((e) => errors.push(e))
          .finally(() => {
            handledResults += 1;
            if (handledResults === callPromises.length) {
              this.multiProviderConfig.logger.warn(
                "All providers failed to execute call."
              );
              reject(
                new AggregateError(
                  errors,
                  `Failed to find at least ${this.multiProviderConfig.numberOfNodesWhichHaveToAgree} agreeing providers.`
                )
              );
            }
          });
      }
    });
  }
}
