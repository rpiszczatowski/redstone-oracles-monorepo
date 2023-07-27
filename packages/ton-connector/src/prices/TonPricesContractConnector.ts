import { IPricesContractAdapter } from "redstone-sdk";
import { TonContractConnector } from "../TonContractConnector";
import { TonPricesContractAdapter } from "./TonPricesContractAdapter";
import { OpenedContract } from "ton";
import { Adapter } from "../../wrappers/Adapter";
import { NetworkProvider } from "@ton-community/blueprint";
import { Address, Cell } from "ton-core";

export class TonPricesContractConnector extends TonContractConnector {
  constructor(
    private networkProvider: NetworkProvider,
    address: Address,
    init?: { code: Cell; data: Cell }
  ) {
    super(address, init);
  }

  async getContract(): Promise<OpenedContract<Adapter>> {
    return Adapter.openForExecute<Adapter>(this.networkProvider);
  }

  async getAdapter(): Promise<IPricesContractAdapter> {
    return new TonPricesContractAdapter(await this.getContract());
  }
}
