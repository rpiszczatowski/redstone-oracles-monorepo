import { BlockWithTransactions } from "@ethersproject/abstract-provider";
import {
  Block,
  EventType,
  FeeData,
  Listener,
  Log,
  Network,
  Provider,
  TransactionReceipt,
  TransactionResponse,
} from "@ethersproject/providers";
import { BigNumber } from "ethers";

/** Abstract class which wraps all easy methods which can easily fallback */
export abstract class ProviderWithFallbackBase implements Provider {
  _isProvider: boolean = true;

  protected abstract executeWithFallback(
    retryNumber: number,
    fnName: string,
    ...args: any[]
  ): Promise<any>;
  abstract getNetwork(): Promise<Network>;
  abstract on(eventName: EventType, listener: Listener): Provider;
  abstract once(eventName: EventType, listener: Listener): Provider;
  abstract emit(eventName: EventType, ...args: any[]): boolean;
  abstract listenerCount(eventName?: EventType | undefined): number;
  abstract listeners(eventName?: EventType | undefined): Listener[];
  abstract off(eventName: EventType, listener?: Listener | undefined): Provider;
  abstract removeAllListeners(eventName?: EventType | undefined): Provider;
  abstract addListener(eventName: EventType, listener: Listener): Provider;
  abstract removeListener(eventName: EventType, listener: Listener): Provider;
  abstract waitForTransaction(
    transactionHash: string,
    confirmations?: number | undefined,
    timeout?: number | undefined
  ): Promise<TransactionReceipt>;

  sendTransaction(...args: any[]): Promise<TransactionResponse> {
    return this.executeWithFallback(0, "sendTransaction", ...args);
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
    return this.executeWithFallback(0, "getBalance", ...args);
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
}
