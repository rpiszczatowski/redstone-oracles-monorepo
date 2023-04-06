import { BlockWithTransactions } from "@ethersproject/abstract-provider";
import { ErrorCode } from "@ethersproject/logger";
import {
  Block,
  EventType,
  FeeData,
  JsonRpcProvider,
  Listener,
  Log,
  Network,
  Provider,
  TransactionReceipt,
  TransactionResponse,
} from "@ethersproject/providers";
import { randomUUID } from "crypto";
import { BigNumber } from "ethers";
import { isDeepStrictEqual } from "util";

export type ProviderWithFallbackConfig = {
  unrecoverableErrors: ErrorCode[];
  logger: { info: (message: string) => void; warn: (message: string) => void };
  providerNames?: string[];
};

export const FALLBACK_DEFAULT_CONFIG: ProviderWithFallbackConfig = {
  unrecoverableErrors: [
    ErrorCode.NONCE_EXPIRED,
    ErrorCode.CALL_EXCEPTION,
    ErrorCode.MISSING_ARGUMENT,
    ErrorCode.MISSING_NEW,
  ],
  logger: { info: console.log, warn: console.log },
};

export class ProviderWithFallback implements Provider {
  private _currentProvider: Provider;
  private readonly _providers: Provider[];
  private _providerIndex = 0;

  private globalListeners: {
    eventType: EventType;
    listener: Listener;
    once: boolean;
  }[] = [];

  private saveGlobalListener(
    eventType: EventType,
    listener: Listener,
    once = false
  ) {
    this.globalListeners.push({ eventType, listener, once });
  }

  private removeGlobalListener(eventType: EventType) {
    for (let i = this.globalListeners.length - 1; i >= 0; i--) {
      if (isDeepStrictEqual(this.globalListeners[i].eventType, eventType)) {
        this.globalListeners.splice(i, 1);
      }
    }
  }

  constructor(
    providers: JsonRpcProvider[],
    private readonly config: ProviderWithFallbackConfig = FALLBACK_DEFAULT_CONFIG
  ) {
    const mainProvider = providers[0];
    if (providers.length < 2) {
      throw new Error("Please provide at least two providers");
    }

    this._currentProvider = mainProvider;
    this._providers = [...providers];
  }

  private async executeWithFallback(
    retryNumber = 0,
    fnName: string,
    ...args: any[]
  ): Promise<any> {
    try {
      return await (this._currentProvider as any)[fnName](...[...args]);
    } catch (error: any) {
      const newProviderIndex = this.electNewProviderOrFail(error, retryNumber);
      this.useProvider(newProviderIndex);
      return await this.executeWithFallback(retryNumber + 1, fnName, ...args);
    }
  }

  private useProvider(providerIndex: number) {
    this._currentProvider.removeAllListeners();
    this._providerIndex = providerIndex;
    const newProvider = this._providers[this._providerIndex];
    this._currentProvider = newProvider;
    for (const { listener, once, eventType } of this.globalListeners) {
      if (once) {
        this._currentProvider.once(eventType, listener);
      } else {
        this._currentProvider.on(eventType, listener);
      }
    }
  }

  private extractProviderName(index: number): string {
    return this.config.providerNames?.[index] ?? index.toString();
  }

  private electNewProviderOrFail(error: any, retryNumber: number): number {
    const providerName = this.extractProviderName(this._providerIndex);

    if (error?.code && this.config.unrecoverableErrors.includes(error.code)) {
      this.config.logger.warn(
        `Unrecoverable error ${error.code}, rethrowing error`
      );
      throw error;
    }

    this.config.logger.warn(
      `Provider ${providerName} failed with error: ${error?.code} ${error.message}`
    );

    if (retryNumber === this._providers.length - 1) {
      this.config.logger.warn(
        `All providers failed to execute action, rethrowing error`
      );
      throw error;
    }

    // if we haven't tried provider for this request
    const nextProviderIndex =
      this._providerIndex + 1 === this._providers.length
        ? 0
        : this._providerIndex + 1;

    const nextProviderName = this.extractProviderName(nextProviderIndex);

    this.config.logger.info(
      `Fallback in to next provider ${nextProviderName}.`
    );

    return nextProviderIndex;
  }

  sendTransaction(...args: any[]): Promise<TransactionResponse> {
    return this.executeWithFallback(0, "sendTransaction", ...args);
  }

  getNetwork(): Promise<Network> {
    return this._currentProvider.getNetwork();
  }

  getBlockNumber(): Promise<number> {
    return this.executeWithFallback(0, "getBlockNumber");
  }

  getGasPrice(): Promise<BigNumber> {
    return this.executeWithFallback(0, "getGasPrice");
  }
  getFeeData(): Promise<FeeData> {
    return this.executeWithFallback(0, "getFeeData");
  }
  getBalance(...args: any[]): Promise<BigNumber> {
    return this.executeWithFallback(0, "getBalance");
  }
  getTransactionCount(...args: any[]): Promise<number> {
    return this.executeWithFallback(0, "getTransactionCount", ...args);
  }
  getCode(...args: any[]): Promise<string> {
    return this.executeWithFallback(0, "getCode", ...args);
  }
  getStorageAt(...args: any[]): Promise<string> {
    return this.executeWithFallback(0, "getStorageAt", ...args);
  }
  call(...args: any[]): Promise<string> {
    return this.executeWithFallback(0, "call", ...args);
  }
  estimateGas(...args: any[]): Promise<BigNumber> {
    return this.executeWithFallback(0, "estimateGas", ...args);
  }
  getBlock(...args: any[]): Promise<Block> {
    return this.executeWithFallback(0, "getBlock", ...args);
  }
  getBlockWithTransactions(...args: any[]): Promise<BlockWithTransactions> {
    return this.executeWithFallback(0, "getBlockWithTransactions", ...args);
  }
  getTransaction(...args: any[]): Promise<TransactionResponse> {
    return this.executeWithFallback(0, "getTransaction", ...args);
  }
  getTransactionReceipt(...args: any[]): Promise<TransactionReceipt> {
    return this.executeWithFallback(0, "getTransactionReceipt", ...args);
  }
  getLogs(...args: any[]): Promise<Log[]> {
    return this.executeWithFallback(0, "getLogs", ...args);
  }
  resolveName(...args: any[]): Promise<string | null> {
    return this.executeWithFallback(0, "resolveName", ...args);
  }
  lookupAddress(...args: any[]): Promise<string | null> {
    return this.executeWithFallback(0, "lookupAddress", ...args);
  }

  on(eventName: EventType, listener: Listener): Provider {
    this.saveGlobalListener(eventName, listener);
    return this._currentProvider.on(eventName, listener);
  }
  once(eventName: EventType, listener: Listener): Provider {
    this.saveGlobalListener(eventName, listener);
    return this._currentProvider.once(eventName, listener);
  }
  emit(eventName: EventType, ...args: any[]): boolean {
    return this._currentProvider.emit(eventName, ...args);
  }
  listenerCount(eventName?: EventType | undefined): number {
    return this._currentProvider.listenerCount(eventName);
  }
  listeners(eventName?: EventType | undefined): Listener[] {
    return this._currentProvider.listeners(eventName);
  }
  off(eventName: EventType, listener?: Listener | undefined): Provider {
    // remove from global
    this.removeGlobalListener(eventName);
    return this._currentProvider.off(eventName, listener);
  }

  removeAllListeners(eventName?: EventType | undefined): Provider {
    this.globalListeners = [];
    return this._currentProvider.removeAllListeners(eventName);
  }
  addListener(eventName: EventType, listener: Listener): Provider {
    return this._currentProvider.addListener(eventName, listener);
  }
  removeListener(eventName: EventType, listener: Listener): Provider {
    this.removeGlobalListener(eventName);
    return this._currentProvider.removeListener(eventName, listener);
  }
  waitForTransaction(
    transactionHash: string,
    confirmations?: number | undefined,
    timeout?: number | undefined
  ): Promise<TransactionReceipt> {
    return this._currentProvider.waitForTransaction(
      transactionHash,
      confirmations,
      timeout
    );
  }
  _isProvider: boolean = true;
}
