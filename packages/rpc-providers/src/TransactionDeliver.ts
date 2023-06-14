import { Contract, BigNumber, providers } from "ethers";
import { sleepMS } from "./common";
import { RPC_ERROR_CODES } from "../test/helpers";
import axios from "axios";

const GWEI = 1e9;

type ContractOverrides = {
  nonce: number;
  gasLimit?: number;
} & FeeStructure;

type LastDeliveryAttempt = {
  nonce: number;
  maxFeePerGas: number;
};

type GasOracleFn = () => Promise<FeeStructure>;

type TransactionDeliverOpts = {
  /**
   * It depends on network block finalization
   * For example for ETH ~12 s block times  we should set it to 14_000
   */
  expectedDeliveryTimeMs: number;

  /**
   * Max number of attempts to deliver transaction
   */
  maxAttempts?: number;

  /**
   * Multiply last failed gas multiplier by
   */
  priorityFeePerGasMultiplier?: number;

  /**
   * Optional fn that can be used to fetch gas fees from something like gas tracker or gas station
   * @returns fee structure in gwei
   */
  gasOracle?: GasOracleFn;

  /**
   * If we want to take rewards from last block we can achieve is using percentiles
   * 75 percentile we will receive reward which was given by 75% of users and 25% of them has given bigger reward
   * the bigger the value the higher priority fee
   * If you want to prioritize speed over cost choose number between 75-95
   * If you want to prioritize cost over speed choose numbers between 1-50
   */
  percentileOfPriorityFee?: number;
};

type FeeStructure = {
  maxFeePerGas: number;
  maxPriorityFeePerGas: number;
};

const DEFAULT_TRANSACTION_DELIVERY_OPTS = {
  maxAttempts: 5,
  priorityFeePerGasMultiplier: 1.125,
  percentileOfPriorityFee: 75,
  gasOracle: () => {
    throw new Error("Missing gas oracle");
  },
};

export class TransactionDeliver {
  private readonly opts: Required<TransactionDeliverOpts>;

  constructor(opts: TransactionDeliverOpts) {
    this.opts = { ...DEFAULT_TRANSACTION_DELIVERY_OPTS, ...opts };
  }

  public async deliver<T extends Contract, M extends keyof T>(
    contract: T,
    method: M,
    params: Parameters<T[M]>,
    gasLimit?: number
  ): Promise<void> {
    const provider = contract.provider as providers.JsonRpcProvider;
    const address = await contract.signer.getAddress();

    let lastAttempt = undefined as LastDeliveryAttempt | undefined;

    const currentNonce = await provider.getTransactionCount(address);
    const contractOverrides: ContractOverrides = {
      gasLimit,
      nonce: currentNonce,
      ...(await this.getFees(provider)),
    };

    for (let i = 0; i < this.opts.maxAttempts; i++) {
      const currentNonce = await provider.getTransactionCount(address);
      if (this.isTransactionDelivered(lastAttempt, currentNonce)) {
        // transaction was already delivered because nonce increased
        return;
      }

      try {
        lastAttempt = { ...contractOverrides };
        await contract[method](...params, contractOverrides);
      } catch (e: any) {
        // if underpriced then bump fee
        console.log(e.message, e.code);
        if (this.isUnderpricedError(e)) {
          const scaledFees = this.scaleFees(await this.getFees(provider));
          Object.assign(contractOverrides, scaledFees);
          // we don't want to sleep on error
          continue;
        } else {
          throw e;
        }
      }

      const scaledFees = this.scaleFees(await this.getFees(provider));
      Object.assign(contractOverrides, scaledFees);
      await sleepMS(this.opts.expectedDeliveryTimeMs);
    }

    throw new Error(
      `Failed to deliver transaction after ${this.opts.maxAttempts} attempts`
    );
  }

  private isUnderpricedError(e: any) {
    return (
      e.message.includes("maxFeePerGas") ||
      e.message.includes("baseFeePerGas") ||
      e.code === RPC_ERROR_CODES.invalidInput
    );
  }

  private isTransactionDelivered(
    lastAttempt: LastDeliveryAttempt | undefined,
    currentNonce: number
  ) {
    return lastAttempt && currentNonce > lastAttempt.nonce;
  }

  async getFees(provider: providers.JsonRpcProvider): Promise<FeeStructure> {
    try {
      return await this.opts.gasOracle();
    } catch (e) {
      // this is reasonable (ether.js is not reasonable) fallback if gasOracle is not set
      const lastBlock = await provider.getBlock("latest");
      const maxPriorityFeePerGas = await this.estimatePriorityFee(provider);

      // we can be sure that his baseFee will be enough even in worst case
      const baseFee = Math.round(
        unsafeBnToNumber(lastBlock.baseFeePerGas as BigNumber)
      );
      const maxFeePerGas = baseFee + maxPriorityFeePerGas;

      return { maxFeePerGas, maxPriorityFeePerGas };
    }
  }

  /**
   * Take value of percentileOfPriorityFee from last 5 blocks.
   * And return maximal value from it.
   */
  async estimatePriorityFee(
    provider: providers.JsonRpcProvider
  ): Promise<number> {
    const feeHistory = await provider.send("eth_feeHistory", [
      "0x2",
      "pending",
      [this.opts.percentileOfPriorityFee],
    ]);

    const rewardsPerBlockForPercentile = feeHistory.reward
      .flat()
      .map((hex: string) => parseInt(hex, 16));

    return Math.max(...rewardsPerBlockForPercentile);
  }

  private scaleFees(currentFees: FeeStructure): FeeStructure {
    const maxPriorityFeePerGas = Math.round(
      currentFees.maxPriorityFeePerGas * this.opts.priorityFeePerGasMultiplier
    );
    const maxFeePerGas = Math.round(
      currentFees.maxFeePerGas * this.opts.priorityFeePerGasMultiplier
    );

    return {
      maxPriorityFeePerGas,
      maxFeePerGas,
    };
  }
}

export const ethGasTrackerOracle: GasOracleFn = async (apiKey: string = "") => {
  const response = // rate limit is 5 seconds
    (
      await axios.get(
        `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${apiKey}`
      )
    ).data;

  const { suggestBaseFee, FastGasPrice } = response.result;

  if (!suggestBaseFee || !FastGasPrice) {
    throw new Error("Failed to fetch price from oracle");
  }

  return {
    maxFeePerGas: FastGasPrice * GWEI,
    maxPriorityFeePerGas: (FastGasPrice - suggestBaseFee) * GWEI,
  };
};

const unsafeBnToNumber = (bn: BigNumber) => Number(bn.toString());
