import { Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
import { Web3FunctionResult } from "@gelatonetwork/web3-functions-sdk/dist/lib/types/Web3FunctionResult";
import { providers } from "ethers";
import {
  IterationArgs,
  IterationArgsProviderInterface,
} from "../IterationArgsProviderInterface";

const REMAINING_NUMBER_OF_FREE_CHECKS_KEY =
  "remainingNumberOfFreeChecksToInvoke";

export class IterationArgsProcessor<Args> {
  constructor(
    private context: Web3FunctionContext,
    private argsProcessor: IterationArgsProviderInterface<Args>
  ) {}

  async processArgs(
    provider: providers.StaticJsonRpcProvider
  ): Promise<Web3FunctionResult> {
    const iterationArgs = await this.argsProcessor.getArgs(
      this.context.userArgs,
      provider
    );

    if (iterationArgs.shouldUpdatePrices) {
      if (!iterationArgs.args) {
        return this.shouldNotExec(iterationArgs, "Args are empty");
      } else {
        const data = await this.argsProcessor.getTransactionData(
          iterationArgs.args
        );

        if (!!data && data != "0x") {
          return this.canExec(data);
        } else {
          return {
            canExec: false,
            message: `Wrong transaction data: '${data}'`,
          };
        }
      }
    } else {
      return this.shouldNotExec(iterationArgs, "Skipping");
    }
  }

  private async shouldNotExec(
    iterationArgs: IterationArgs<Args>,
    alternativeMessage = "Unknown reason"
  ): Promise<Web3FunctionResult> {
    await this.context.storage.set(
      REMAINING_NUMBER_OF_FREE_CHECKS_KEY,
      `${this.context.userArgs.numberOfFreeChecksToInvoke}`
    );

    return {
      canExec: false,
      message: iterationArgs.message || alternativeMessage,
    };
  }

  private async canExec(data: string): Promise<Web3FunctionResult> {
    const { userArgs, storage } = this.context;

    const storageNumberOfFreeChecksToInvoke = await storage.get(
      REMAINING_NUMBER_OF_FREE_CHECKS_KEY
    );
    console.log(
      `storageNumberOfFreeChecksToInvoke = ${storageNumberOfFreeChecksToInvoke}`
    );

    const remainingNumberOfFreeChecksToInvoke = Number.parseInt(
      storageNumberOfFreeChecksToInvoke ??
        `${userArgs.numberOfFreeChecksToInvoke}`
    );

    console.log(
      `remainingNumberOfFreeChecksToInvoke = ${remainingNumberOfFreeChecksToInvoke}`
    );

    if (remainingNumberOfFreeChecksToInvoke > 0) {
      await storage.set(
        REMAINING_NUMBER_OF_FREE_CHECKS_KEY,
        `${remainingNumberOfFreeChecksToInvoke - 1}`
      );

      return {
        canExec: false,
        message: `Could've executed, but SKIPPED because of ${remainingNumberOfFreeChecksToInvoke} free check(s) were/was existing.`,
      };
    }

    await storage.set(
      REMAINING_NUMBER_OF_FREE_CHECKS_KEY,
      `${userArgs.numberOfFreeChecksToInvoke}`
    );

    return {
      canExec: true,
      callData: [{ data, to: `${userArgs.adapterContractAddress}` }],
    };
  }
}
