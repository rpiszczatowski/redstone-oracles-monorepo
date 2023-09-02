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

// TODO: looks like there is a bug in this function
// Or not
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
  private logger: {
    info: (msg: string) => void;
    warn: (msg: string) => void;
  };

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

    this.lastBlockNumber = 0;

    // Start listening on block numbers
    this.startListeningOnBlocks();

    const networkName = providers[0].network.name;
    const agreementProviderId = `AggrProvider (${networkName})`;
    this.logger = {
      warn(msg: string) {
        logger.warn(`${agreementProviderId}: ${msg}`);
      },
      info(msg: string) {
        logger.info(`${agreementProviderId}: ${msg}`);
      },
    };

    // Hack: setting default (valid block numbers for known networks)
    const nn = networkName.toLowerCase();
    if (!nn.includes("test")) {
      if (nn.includes("ethereum")) {
        this.lastBlockNumber = 18050446;
      }
      if (nn.includes("arbitrum")) {
        this.lastBlockNumber = 127416055;
      }
      if (nn.includes("optimism")) {
        this.lastBlockNumber = 109036024;
      }
      if (nn.includes("avalanche")) {
        this.lastBlockNumber = 34689286;
      }
    }
  }

  startListeningOnBlocks() {
    for (
      let providerIndex = 0;
      providerIndex < this.providers.length;
      providerIndex++
    ) {
      const logPrefix = `(rpc #${providerIndex})`;
      this.providers[providerIndex].on("block", (blockNumber) => {
        this.logger.info(
          `${logPrefix}: Received on-block hook: ${blockNumber}`
        );

        const receivedBlockNumber = Number(blockNumber);
        const diff = receivedBlockNumber - this.lastBlockNumber;

        if (receivedBlockNumber < this.lastBlockNumber || isNaN(receivedBlockNumber) || Math.abs(diff) > 10) {
          this.logger.warn(
            `${logPrefix}: Weird block number received: ${blockNumber}. Diff: ${diff}. Last: ${this.lastBlockNumber}. Received: ${receivedBlockNumber}`
          );
        }

        if (receivedBlockNumber > this.lastBlockNumber && Math.abs(diff) < 100_000) {
          this.logger.info(
            `${logPrefix}: New block number received: ${blockNumber}`
          );
          this.lastBlockNumber = receivedBlockNumber;
        }
      });
    }
  }

  logTimeMs(label: string, timeInMs: number) {
    const rounded = Math.round(timeInMs / 20) * 20;
    this.logger.info(`${label}. Rounded: ${rounded}ms. Exact: ${timeInMs}ms.`);
  }

  override async getBlockNumber(): Promise<number> {
    try {
      const timeBeforeElection = Date.now();
      const electedBlockNumber = await this.electBlockNumber();
      const blockElectionTimeMs = Date.now() - timeBeforeElection;
      if (isNaN(electedBlockNumber)) {
        const errMsg = `Elected block number is NaN: ${electedBlockNumber}`;
        this.logger.warn(errMsg);
        throw new Error(errMsg);
      }
      this.logger.info(
        `Successfully elected block number: ${electedBlockNumber}`
      );
      this.logTimeMs("Block election time", blockElectionTimeMs);
      const listenedBlockNumber = this.lastBlockNumber;
      const blockNumDiff = electedBlockNumber - listenedBlockNumber;
      if (Math.abs(blockNumDiff) > 0 && listenedBlockNumber > 0) {
        this.logger.warn(
          `Elected block number differs from listened block number. ` +
            `Diff: ${blockNumDiff}. ` +
            `Elected: ${electedBlockNumber}. ` +
            `Listened: ${listenedBlockNumber}`
        );
      }

      // Setting listened block number for the first time
      if (this.lastBlockNumber === 0) {
        this.lastBlockNumber = electedBlockNumber;
      }

      return electedBlockNumber;
    } catch (e: any) {
      this.logger.warn(
        `Error during block number election. We'll use block number from listener instead: ${e.stack}`
      );

      if (this.lastBlockNumber === 0) {
        throw new Error(`Didn't receive any last block number`);
      } else {
        return this.lastBlockNumber;
      }
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
        this.logger.info(`Requesting block number from rpc #${providerId}`);
        const receivedBlockNumber = await timeout(
          provider.getBlockNumber(),
          this.agreementConfig.getBlockNumberTimeoutMS
        );
        this.logger.info(
          `Successfully fetched block number from rpc #${providerId}. Block number: ${receivedBlockNumber}`
        );
        return receivedBlockNumber;
      } catch (e: any) {
        this.logger.warn(
          `Failed to fetch block number from rpc #${providerId}: ${e.stack}`
        );
        throw e;
      }
    };

    // collect block numbers
    this.logger.info(`Collecting block numbers from RPCs`);
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
      const timeBeforeCall = Date.now();

      const syncProvider = async (providerIndex: number) => {
        while (!stop && blockPerProvider[providerIndex] < electedBlockNumber) {
          this.logger.info(`Syncing provider #${providerIndex}`);
          try {
            blockPerProvider[providerIndex] = await this.providers[
              providerIndex
            ].getBlockNumber();
          } catch (e: any) {
            this.logger.warn(
              `Failed during syncing with getting block number by provider #${providerIndex}. ${e.stack}`
            );
            throw e;
          }

          await sleepMS(this.agreementConfig.sleepBetweenBlockSync);
        }

        this.logger.info(`Provider synced #${providerIndex}`);
      };

      const call = async (providerIndex: number) => {
        let currentResult;
        try {
          currentResult = await this.providers[providerIndex].call(
            transaction,
            electedBlockTag
          );
        } catch (e: any) {
          this.logger.warn(
            `Failed to make call by provider #${providerIndex}. ${e.stack}`
          );
          throw e;
        }

        const currentResultCount = results.get(currentResult) || 0;

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
          if (!stop) {
            // preventing too many confusing logs, and to avoid double resolving
            stop = true;
            const provIndexes = resultsToProviderIndexes[currentResult];
            this.logger.info(
              provIndexes
                .map((i) => `Used for result selection provider #${i}`)
                .join(", ") + ` Result: ${currentResult}`
            );
            const callTimeMs = Date.now() - timeBeforeCall;
            this.logTimeMs("Call time", callTimeMs);
            resolve(currentResult);
          }
        }
      };

      const handleProviderResult = () => {
        finishedProvidersCount++;
        if (finishedProvidersCount === this.providers.length) {
          stop = true;
          this.logger.warn(
            `Failed to achieve consensus. Min rpcs to agree for consensus: ${this.agreementConfig.numberOfProvidersThatHaveToAgree}. ` +
              JSON.stringify({
                blockPerProvider,
                resultsToProviderIndexes,
                finishedProvidersCount,
                errors,
              })
          );
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
