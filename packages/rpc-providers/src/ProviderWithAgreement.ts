import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";
import { JsonRpcProvider } from "@ethersproject/providers";
import { utils } from "ethers";
import { sleepMS } from "./common";
import _ from "lodash";
import {
  ProviderWithFallback,
  ProviderWithFallbackConfig,
} from "./ProviderWithFallback";

export interface ProviderWithAgreementConfig {
  numberOfProvidersThatHaveToAgree: number;
  getBlockNumberTimeoutMS: number;
  sleepBetweenBlockSync: number;
}

const defaultConfig: Omit<
  ProviderWithAgreementConfig,
  keyof ProviderWithFallbackConfig
> = {
  numberOfProvidersThatHaveToAgree: 2,
  getBlockNumberTimeoutMS: 2_000,
  sleepBetweenBlockSync: 500,
};

export class ProviderWithAgreement extends ProviderWithFallback {
  private readonly agreementConfig: ProviderWithAgreementConfig;

  constructor(
    providers: JsonRpcProvider[],
    config: Partial<
      ProviderWithAgreementConfig & ProviderWithFallbackConfig
    > = {}
  ) {
    super(providers, config);
    this.agreementConfig = {
      ...defaultConfig,
      ...config,
    };
    const numberOfProvidersThatHaveToAgree =
      this.agreementConfig.numberOfProvidersThatHaveToAgree;
    if (
      numberOfProvidersThatHaveToAgree < 2 ||
      numberOfProvidersThatHaveToAgree > this.providers.length
    ) {
      throw new Error(
        "numberOfProvidersWhichHaveToAgree should be >= 2 and > then supplied providers count"
      );
    }
  }

  /**
   * We try to take blockNumber only from first provider however if we fail we fallback to next provider
   * After fetching we change back to firstProvider, because he is privileged
   * @returns blockNumber
   */
  private async electBlockNumber() {
    this.useProvider(0);
    const blockNumber = await this.getBlockNumber();
    this.useProvider(0);
    return blockNumber;
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
      let finishedProvidersCount = 0;

      const syncProvider = async (providerIndex: number) => {
        while (!stop && blockPerProvider[providerIndex] < electedBlockNumber) {
          blockPerProvider[providerIndex] = await this.providers[
            providerIndex
          ].getBlockNumber();
          await sleepMS(this.agreementConfig.sleepBetweenBlockSync);
        }
      };

      const call = async (providerIndex: number) => {
        const currentResult = await this.providers[providerIndex].call(
          transaction,
          electedBlockTag
        );
        const currentResultCount = results.get(currentResult);

        if (currentResultCount) {
          results.set(currentResult, currentResultCount + 1);
          // we have found satisfying number of same responses
          if (
            currentResultCount + 1 >=
            this.agreementConfig.numberOfProvidersThatHaveToAgree
          ) {
            stop = true;
            resolve(currentResult);
          }
        } else {
          results.set(currentResult, 1);
        }
      };

      const handleProviderResult = () => {
        finishedProvidersCount++;
        if (finishedProvidersCount === this.providers.length) {
          stop = true;
          reject(
            new AggregateError(
              errors,
              `Failed to find at least ${this.agreementConfig.numberOfProvidersThatHaveToAgree} agreeing providers.`
            )
          );
        }
      };

      const syncThenCall = async (providerIndex: number) => {
        try {
          await syncProvider(providerIndex);
          await call(providerIndex);
        } catch (e: any) {
          errors.push(e);
        } finally {
          handleProviderResult();
        }
      };

      this.pickProviders().forEach((_, providerIndex) =>
        syncThenCall(providerIndex)
      );
    });
  }

  private pickProviders() {
    const freeProviders = this.providers.slice(1);

    // it doesn't have to shuffle providers if we don't have enough of them
    if (freeProviders.length > 3) {
      _.shuffle(freeProviders).slice(Math.floor(freeProviders.length / 2));
    }

    return [this.providers[0], ...freeProviders];
  }
}

const convertBlockTagToNumber = (blockTag: BlockTag): number =>
  typeof blockTag === "string" ? convertHexToNumber(blockTag) : blockTag;

const convertHexToNumber = (hex: string): number => {
  const number = Number.parseInt(hex, 16);
  if (Number.isNaN(number)) {
    throw new Error(`Failed to parse ${hex} to number`);
  }
  return number;
};
