import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";
import { JsonRpcProvider } from "@ethersproject/providers";
import { utils } from "ethers";
import { sleepMS, timeout } from "./common";
import {
  ProviderWithFallback,
  ProviderWithFallbackConfig,
} from "./ProviderWithFallback";

export interface ProviderWithAgreementConfig
  extends ProviderWithFallbackConfig {
  numberOfProvidersWhichHaveToAgree: number;
  getBlockNumberTimeoutMS: number;
  sleepBetweenBlockSynReq: number;
  electBlockFn: (
    blocks: number[],
    numberOfAgreeingNodes: number
  ) => number | undefined;
}

const DEFAULT_ELECT_BLOCK_FN = (
  blockNumbers: number[],
  numberOfProviders: number
): number | undefined => {
  if (blockNumbers.length === 1) {
    return blockNumbers[0];
  }
  // TODO: allow for 80% for example

  return blockNumbers
    .sort((a, b) => a - b)
    .at(Math.floor(numberOfProviders / 3)) as number;
};

const defaultConfig: Omit<
  ProviderWithAgreementConfig,
  keyof ProviderWithFallbackConfig
> = {
  numberOfProvidersWhichHaveToAgree: 2,
  getBlockNumberTimeoutMS: 1_500,
  sleepBetweenBlockSynReq: 100,
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
    const callResult = this.executeCallWithAgreement(transaction, blockTag);

    return callResult;
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

  private executeCallWithAgreement(
    transaction: Deferrable<TransactionRequest>,
    blockTag?: BlockTag
  ) {
    return new Promise<string>((resolve, reject) => {
      const errors: Error[] = [];
      const results = new Map<string, number>();
      const blockPerProvider: Record<number, number> = {};
      let stop = false;
      let handledResults = 0;
      let electedBlockTag = blockTag;

      const sync = async (providerIndex: number) => {
        if (stop) return;

        while (blockPerProvider[providerIndex] !== electedBlockTag) {
          try {
            blockPerProvider[providerIndex] = await this.providers[
              providerIndex
            ].getBlockNumber();
          } catch (e) {}
          await sleepMS(this.agreementConfig.sleepBetweenBlockSynReq);
        }
      };

      const syncThenCall = async (providerIndex: number) => {
        await sync(providerIndex);
        if (stop) {
          return;
        }
        try {
          const currentResult = await this.providers[providerIndex].call(
            transaction,
            electedBlockTag
          );
          const currentResultCount = results.get(currentResult);

          // we have found satisfying number of same responses
          if (currentResultCount) {
            results.set(currentResult, currentResultCount + 1);
            if (
              currentResultCount + 1 ===
              this.agreementConfig.numberOfProvidersWhichHaveToAgree
            ) {
              stop = true;
              resolve(currentResult);
            }
          } else {
            results.set(currentResult, 1);
          }
        } catch (e: any) {
          errors.push(e);
        }
        handledResults += 1;
        if (handledResults === this.providers.length) {
          reject(
            new AggregateError(
              errors,
              `Failed to find at least ${this.agreementConfig.numberOfProvidersWhichHaveToAgree} agreeing providers.`
            )
          );
        }
      };

      const electBlock = () => {
        const currentBlocks = Object.values(blockPerProvider);
        electedBlockTag = this.agreementConfig.electBlockFn(
          currentBlocks,
          this.providers.length
        );
      };

      const process = async () => {
        for (
          let providerIndex = 0;
          providerIndex < this.providers.length;
          providerIndex++
        ) {
          syncThenCall(providerIndex);
        }

        while (!electedBlockTag) {
          electBlock();
          await sleepMS(this.agreementConfig.sleepBetweenBlockSynReq + 10);
        }
      };

      process();
    });
  }
}
