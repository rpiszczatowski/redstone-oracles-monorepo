import { TonPriceManagerContractAdapter } from "./TonPriceManagerContractAdapter";
import { TonPriceManager } from "../../wrappers/TonPriceManager";
import { TonContractConnector } from "../TonContractConnector";
import { IPricesContractAdapter } from "redstone-sdk";

import { TonNetwork } from "../network/TonNetwork";

export class TonPriceManagerContractConnector extends TonContractConnector<
  TonPriceManager,
  IPricesContractAdapter
> {
  constructor(network: TonNetwork, address: string) {
    super(TonPriceManager, network, address);
  }

  async getAdapter(): Promise<IPricesContractAdapter> {
    return new TonPriceManagerContractAdapter(await this.getContract());
  }
}
