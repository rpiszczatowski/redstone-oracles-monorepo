import { TonContract } from "./TonContract";
import { OpenedContract } from "ton";
import { TonContractFactory } from "./TonContractFactory";

import { TonNetwork } from "./network/TonNetwork";
import { SandboxContract } from "@ton-community/sandbox";
import { IContractConnector } from "redstone-sdk";

export abstract class TonContractConnector<
  Contract extends TonContract,
  Adapter
> implements IContractConnector<Adapter>
{
  protected constructor(
    protected contractType: typeof TonContract,
    protected network: TonNetwork,
    private address?: string
  ) {}

  async makeContract(
    contractFactory: TonContractFactory
  ): Promise<TonContract> {
    return await contractFactory.makeForExecute(this.network, this.address!);
  }

  async getContract(): Promise<
    OpenedContract<Contract> | SandboxContract<Contract>
  > {
    const contractFactory = new TonContractFactory(this.contractType);
    const contract = await this.makeContract(contractFactory);

    return this.network.open(contract as Contract);
  }

  abstract getAdapter(): Promise<Adapter>;

  async getBlockNumber(rpcUrl: string): Promise<number> {
    return (await this.network.api!.getLastBlock()).last.seqno;
  }
}
