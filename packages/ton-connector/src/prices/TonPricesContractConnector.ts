import { IPricesContractAdapter } from "redstone-sdk";
import { TonPricesContractAdapter } from "./TonPricesContractAdapter";
import { OpenedContract } from "ton";
import { Adapter } from "../../wrappers/Adapter";
import { NetworkProvider } from "@ton-community/blueprint";

export class TonPricesContractConnector {
  constructor(private networkProvider: NetworkProvider) {}

  async getContract(): Promise<OpenedContract<Adapter>> {
    const contract = await Adapter.openForExecute<Adapter>();

    await contract.connect(this.networkProvider);

    return contract.client!.open(contract);
  }

  async getAdapter(): Promise<IPricesContractAdapter> {
    return new TonPricesContractAdapter(await this.getContract());
  }
}
