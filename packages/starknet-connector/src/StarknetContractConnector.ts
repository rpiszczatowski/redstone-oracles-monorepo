import axios from "axios";
import {
  Abi,
  AccountInterface,
  Contract,
  Provider,
  TransactionStatus,
} from "starknet";

const WAIT_FOR_TRANSACTION_TIME_INTERVAL = 30103;

export enum NetworkName {
  SN_MAIN = "SN_MAIN",
  SN_GOERLI = "SN_GOERLI",
  SN_GOERLI2 = "SN_GOERLI2",
}
export const FEE_MULTIPLIER = 1000000000000000000;

export abstract class StarknetContractConnector {
  provider: AccountInterface | Provider;

  protected constructor(
    account: AccountInterface | undefined,
    private contractAddress: string,
    private abi: Abi,
    private network: NetworkName = NetworkName.SN_GOERLI
  ) {
    this.provider =
      account || new Provider({ sequencer: { network: this.network } });
  }

  async waitForTransaction(txHash: string): Promise<boolean> {
    const successState = TransactionStatus.PENDING;
    const result = await this.provider.waitForTransaction(txHash, {
      retryInterval: WAIT_FOR_TRANSACTION_TIME_INTERVAL,
      successStates: [successState, TransactionStatus.REJECTED],
    });

    console.log(
      `Transaction ${txHash} finished with status: ${result.status}, fee: ${
        result.actual_fee != undefined
          ? parseInt(result.actual_fee) / FEE_MULTIPLIER
          : result.actual_fee
      } ETH`
    );

    return result.status == successState;
  }

  getContract(): Contract {
    return new Contract(this.abi, this.contractAddress, this.provider);
  }

  async getBlockNumber(rpcUrl: string): Promise<number> {
    const response = await axios.post(rpcUrl, {
      jsonrpc: "2.0",
      method: "starknet_blockNumber",
      params: [],
      id: 1,
    });

    return response.data.result;
  }
}
