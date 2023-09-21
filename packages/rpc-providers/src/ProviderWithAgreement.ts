import { BlockTag, TransactionRequest } from "@ethersproject/abstract-provider";
import { Deferrable } from "@ethersproject/properties";
import { JsonRpcProvider } from "@ethersproject/providers";
import { utils } from "ethers";
import { RedstoneCommon } from "@redstone-finance/utils";
import { sleepMS } from "./common";
import {
  PROVIDER_OPERATION_TIMEOUT,
  ProviderWithFallback,
  ProviderWithFallbackConfig,
} from "./ProviderWithFallback";
import { ethers } from "ethers";
import TelemetrySendService from "./TelemetrySendService";
import { json } from "stream/consumers";

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
  sleepBetweenBlockSync: 400,
  electBlockFn: DEFAULT_ELECT_BLOCK_FN,
};

export class ProviderWithAgreement extends ProviderWithFallback {
  private readonly agreementConfig: ProviderWithAgreementConfig;
  private telemetrySendService: TelemetrySendService;
  private address: string;

  constructor(
    providers: JsonRpcProvider[],
    telemetryUrl: string,
    telemetryAuth: string,
    address: string,
    config: Partial<
      ProviderWithAgreementConfig & ProviderWithFallbackConfig
    > = {}
  ) {
    super(providers, config);
    console.log("AGREEMENT PROVIDER CONSTRUCTOR10");
    this.agreementConfig = {
      ...defaultConfig,
      ...config,
    };
    this.address = address;
    this.telemetrySendService = new TelemetrySendService(
      telemetryUrl,
      telemetryAuth
    );
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
    const send = this.telemetrySendService;
    setInterval(function () {
      console.log("SENDINGGGG");
      send.sendMetricsBatch();
    }, 10 * 1000);
  }

  override getBlockNumber(): Promise<number> {
    console.log("getBlockNumberssss");
    return this.electBlockNumber();
  }

  override async call(
    transaction: Deferrable<TransactionRequest>,
    blockTag?: BlockTag
  ): Promise<string> {
    console.log("CALLLLLLLLLL");
    const electedBlockTag = utils.hexlify(
      blockTag ?? (await this.electBlockNumber())
    );
    const callResult = RedstoneCommon.timeout(
      this.executeCallWithAgreement(transaction, electedBlockTag),
      PROVIDER_OPERATION_TIMEOUT,
      `Agreement provider after ${PROVIDER_OPERATION_TIMEOUT} [ms] during call`
    );

    return await callResult;
  }

  private electBlockNumber = RedstoneCommon.memoize({
    functionToMemoize: async () => {
      console.log("ELECTTTT");
      // collect block numbers
      const blockNumbersResults = await Promise.allSettled(
        this.providers.map(async (provider) => {
          console.log("SOME PROVIDER");
          const jsonProvider1 = provider as JsonRpcProvider;
          const url1 = jsonProvider1.connection.url;
          console.log(url1);
          const start = Date.now();
          const result = RedstoneCommon.timeout(
            provider.getBlockNumber(),
            this.agreementConfig.getBlockNumberTimeoutMS
          );
          // .then((x) => {
          //   console.log("RESULT: " + x);
          //   return x;
          // })
          // .catch((fail) => {
          //   console.log("RESULT FAIL");
          //   console.log(fail);
          //   return -1;
          // });

          console.log("Sent request1");
          const measurementName = "electBlockNumber";
          const jsonProvider = provider as JsonRpcProvider;
          const url = jsonProvider.connection.url;
          const network = jsonProvider.network.name;
          try {
            console.log("TRY 1");
            const promiseResult = await result;
            const stop = Date.now();
            const executionTime = stop - start;
            const tags = `address=${this.address},success=true,url=${url
              .split("=")
              .join("-")},network=${network.split(" ").join("-")}`;
            const fields = `executionTime=${executionTime},blockNumber=${promiseResult}`;
            const metric = `${measurementName},${tags} ${fields} ${start}`;
            console.log("TRY 2");
            this.telemetrySendService.queueToSendMetric(metric);
            console.log("TRY 3");
            return promiseResult;
          } catch (error) {
            console.log("ERROR 1");
            console.log(error);
            const stop = Date.now();
            const executionTime = stop - start;
            const tags = `address=${this.address},success=false,url=${url
              .split("=")
              .join("-")},network=${network.split(" ").join("_")}`;
            const fields = `executionTime=${executionTime}`;
            const metric = `${measurementName},${tags} ${fields} ${start}`;
            this.telemetrySendService.queueToSendMetric(metric);
            console.log("ERROR 2");
          }

          return result;
        })
      );

      const blockNumbers = blockNumbersResults
        .filter((result) => result.status === "fulfilled")
        .map((result) => (result as PromiseFulfilledResult<number>).value);

      if (blockNumbers.length === 0) {
        throw new AggregateError(
          blockNumbersResults.map(
            (result) =>
              new Error(String((result as PromiseRejectedResult).reason))
          ),
          `Failed to getBlockNumber from at least one provider`
        );
      }

      const electedBlockNumber = this.agreementConfig.electBlockFn(
        blockNumbers,
        this.providers.length
      );

      return electedBlockNumber;
    },
    ttl: BLOCK_NUMBER_TTL,
  });

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
          blockPerProvider[providerIndex] =
            await this.providers[providerIndex].getBlockNumber();
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
        } catch (e) {
          errors.push(e as Error);
        } finally {
          handleProviderResult();
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
