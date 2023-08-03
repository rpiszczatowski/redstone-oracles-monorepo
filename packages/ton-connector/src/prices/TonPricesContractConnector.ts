import { IPricesContractAdapter } from "redstone-sdk";
import { TonPricesContractAdapter } from "./TonPricesContractAdapter";
import { OpenedContract } from "ton";
import { Adapter } from "../../wrappers/Adapter";
import { NetworkProvider } from "@ton-community/blueprint";

export class TonPricesContractConnector {
  constructor(private networkProvider: NetworkProvider) {}

  async getContract(): Promise<OpenedContract<Adapter>> {
    const contract = await Adapter.openForExecute<Adapter>(
      this.networkProvider
    );

    return this.networkProvider.open(contract);
  }

  async getAdapter(): Promise<TonPricesContractAdapter> {
    return new TonPricesContractAdapter(await this.getContract());
  }
}

export class TonPricesContractDeployer {
  constructor(private networkProvider: NetworkProvider) {}

  async getContract(): Promise<OpenedContract<Adapter>> {
    const contract = await Adapter.openForDeploy<Adapter>(this.networkProvider);

    return this.networkProvider.open(contract);
  }

  async getAdapter(): Promise<TonPricesContractAdapter> {
    return new TonPricesContractAdapter(await this.getContract());
  }
}
