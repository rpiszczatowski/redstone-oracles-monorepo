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
  blockNumberCacheTTLInMS: number;
  electBlockFn: (blocks: number[], numberOfAgreeingNodes: number) => number;
}

const DEFAULT_ELECT_BLOCK_FN = (
  blockNumbers: number[],
  numberOfProviders: number
): number => {
  if (blockNumbers.length === 1) {
    return blockNumbers[0];
  }
  const mid = Math.floor(blockNumbers.length / 2);

  if (blockNumbers.length / numberOfProviders < 0.5) {
    throw new Error(
      "Failed to elect block number more then 50% of providers didn't respond"
    );
  }

  blockNumbers.sort((a, b) => a - b);

  return blockNumbers.length % 2 !== 0
    ? blockNumbers[mid]
    : Math.round((blockNumbers[mid - 1] + blockNumbers[mid]) / 2);
};

const defaultConfig: Omit<
  ProviderWithAgreementConfig,
  keyof ProviderWithFallbackConfig
> = {
  numberOfProvidersWhichHaveToAgree: 2,
  getBlockNumberTimeoutMS: 1_000,
  sleepBetweenBlockSynReq: 100,
  blockNumberCacheTTLInMS: 50000,
  electBlockFn: DEFAULT_ELECT_BLOCK_FN,
};

export class ProviderWithAgreement extends ProviderWithFallback {
  private readonly agreementConfig: ProviderWithAgreementConfig;
  private blockNumberCache = { value: 0, lastUpdate: 0n };

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
    );
    const callResult = this.executeCallWithAgreement(
      transaction,
      electedBlockTag
    );

    return callResult;
  }

  private async electBlockNumber(): Promise<number> {
    if (
      process.hrtime.bigint() - this.blockNumberCache.lastUpdate <
      BigInt(this.agreementConfig.blockNumberCacheTTLInMS * 1e6)
    ) {
      return this.blockNumberCache.value;
    }

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

    const electedBlockNumber = this.agreementConfig.electBlockFn(
      blockNumbers,
      this.providers.length
    );

    this.blockNumberCache = {
      value: electedBlockNumber,
      lastUpdate: process.hrtime.bigint(),
    };

    return electedBlockNumber;
  }

  private executeCallWithAgreement(
    transaction: Deferrable<TransactionRequest>,
    electedBlockTag: BlockTag
  ) {
    return new Promise<string>((resolve, reject) => {
      const electedBlockNumber = convertBlockTagToNumber(electedBlockTag);
      const errors: Error[] = [];
      const results = new Map<string, number>();
      const blockPerProvider: Record<number, number> = {};
      let stop = false;
      let handledResults = 0;

      const sync = async (providerIndex: number) => {
        if (stop) return;

        while (blockPerProvider[providerIndex] < electedBlockNumber) {
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

          if (currentResultCount) {
            results.set(currentResult, currentResultCount + 1);
            // we have found satisfying number of same responses
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
          stop = true;
          reject(
            new AggregateError(
              errors,
              `Failed to find at least ${this.agreementConfig.numberOfProvidersWhichHaveToAgree} agreeing providers.`
            )
          );
        }
      };

      this.providers.forEach((_, providerIndex) => syncThenCall(providerIndex));
    });
  }
}

const convertBlockTagToNumber = (blockTag: BlockTag): number =>
  typeof blockTag === "string" ? parseInt(blockTag, 16) : blockTag;
