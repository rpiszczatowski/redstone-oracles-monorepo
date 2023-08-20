import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";
import { Provider, JsonRpcProvider } from "@ethersproject/providers";
import { utils } from "ethers";
import { RedstoneCommon } from "redstone-utils";
import { sleepMS, timeout } from "./common";
import {
  ProviderWithFallback,
  ProviderWithFallbackConfig,
  logger,
} from "./ProviderWithFallback";

const BLOCK_NUMBER_TTL = 200;

export interface ProviderWithAgreementConfig {
  numberOfProvidersThatHaveToAgree: number;
  getBlockNumberTimeoutMS: number;
  sleepBetweenBlockSync: number;
  electBlockFn: (blocks: number[], numberOfAgreeingNodes: number) => number;
}

const DEFAULT_ELECT_BLOCK_FN = (blockNumbers: number[]): number => {
  const mid = Math.floor(blockNumbers.length / 2);
  blockNumbers.sort((a, b) => a - b);

  return blockNumbers.length % 2 !== 0
    ? blockNumbers[mid]
    : Math.round((blockNumbers[mid - 1] + blockNumbers[mid]) / 2);
};

const defaultConfig: Omit<
  ProviderWithAgreementConfig,
  keyof ProviderWithFallbackConfig
> = {
  numberOfProvidersThatHaveToAgree: 2,
  getBlockNumberTimeoutMS: 2_500,
  sleepBetweenBlockSync: 1000,
  electBlockFn: DEFAULT_ELECT_BLOCK_FN,
};

export class ProviderWithAgreement extends ProviderWithFallback {
  private lastBlockNumber: number;
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

    // Start listening on block numbers
    this.lastBlockNumber = 0;
    this.startListeningOnBlocks();
  }

  startListeningOnBlocks() {
    this.providers[0].on("block", (blockNumber) => {
      logger.info(`New block received: ${blockNumber}`);
      this.lastBlockNumber = Number(blockNumber);
    });
  }

  override async getBlockNumber(): Promise<number> {
    try {
      const electedBlockNumber = await this.electBlockNumber();
      logger.info(`Successfully elected block number: ${electedBlockNumber}`);
      return electedBlockNumber;
    } catch (e: any) {
      logger.warn(
        `Error during block number election. We'll use block number from listener instead: ${e.stack}`
      );
      return this.lastBlockNumber;
    }
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

  private electBlockNumber = RedstoneCommon.memoize(async () => {
    const getBlockNumberFromProvider = async (
      provider: Provider,
      providerId: number
    ) => {
      try {
        logger.info(`Requesting block number from rpc #${providerId}`);
        const receivedBlockNumber = await timeout(
          provider.getBlockNumber(),
          this.agreementConfig.getBlockNumberTimeoutMS
        );
        logger.info(
          `Successfully fetched block number from rpc #${providerId}`
        );
        return receivedBlockNumber;
      } catch (e: any) {
        logger.warn(
          `Failed to fetch block number from rpc #${providerId}: ${e.stack}`
        );
      }
    };

    // collect block numbers
    logger.info(`Collecting block numbers from RPCs`);
    const promises = [];
    for (let providerId = 0; providerId < this.providers.length; providerId++) {
      const provider = this.providers[providerId];
      promises.push(getBlockNumberFromProvider(provider, providerId));
    }

    const blockNumbersResults = await Promise.allSettled(promises);

    const blockNumbers = blockNumbersResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => (result as PromiseFulfilledResult<number>).value);

    if (blockNumbers.length === 0) {
      throw new AggregateError(
        `Failed to getBlockNumber from at least one provider: ${blockNumbersResults.map(
          (result) => (result as PromiseRejectedResult).reason
        )}`
      );
    }

    const electedBlockNumber = this.agreementConfig.electBlockFn(
      blockNumbers,
      this.providers.length
    );

    return electedBlockNumber;
  }, BLOCK_NUMBER_TTL);

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
      const resultsToProviderIndexes: Record<string, number[]> = {};

      const syncProvider = async (providerIndex: number) => {
        while (!stop && blockPerProvider[providerIndex] < electedBlockNumber) {
          try {
            blockPerProvider[providerIndex] = await this.providers[
              providerIndex
            ].getBlockNumber();
          } catch (e: any) {
            logger.warn(
              `Failed during syncing with getting block number by provider #${providerIndex}. ${e.stack}`
            );
            throw e;
          }

          await sleepMS(this.agreementConfig.sleepBetweenBlockSync);
        }
      };

      const call = async (providerIndex: number) => {
        let currentResult;
        try {
          currentResult = await this.providers[providerIndex].call(
            transaction,
            electedBlockTag
          );
        } catch (e: any) {
          logger.warn(
            `Failed to make call by provider #${providerIndex}. ${e.stack}`
          );
          throw e;
        }

        const currentResultCount = results.get(currentResult);

        if (currentResultCount) {
          results.set(currentResult, currentResultCount + 1);
          if (!resultsToProviderIndexes[currentResult]) {
            resultsToProviderIndexes[currentResult] = [];
          }
          resultsToProviderIndexes[currentResult].push(providerIndex);

          // we have found satisfying number of same responses
          if (
            currentResultCount + 1 >=
            this.agreementConfig.numberOfProvidersThatHaveToAgree
          ) {
            stop = true;
            for (const providerIdUsedForSelection of resultsToProviderIndexes[
              currentResult
            ]) {
              logger.info(
                `Provider used for result selection #${providerIdUsedForSelection}`
              );
            }

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

      this.providers.forEach((_, providerIndex) => syncThenCall(providerIndex));
    });
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
