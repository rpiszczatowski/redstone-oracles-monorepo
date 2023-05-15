import { TonClient, TonClient4 } from "ton";
import { Address, Contract, OpenedContract, Sender } from "ton-core";
import { NetworkProvider } from "@ton-community/blueprint";
import { TonNetwork } from "./TonNetwork";

export class BlueprintTonNetwork implements TonNetwork {
  oldApi: TonClient;
  sender: Sender;
  api: TonClient4;
  workchain: number;

  constructor(
    private networkProvider: NetworkProvider,
    apiV2Config: { apiEndpoint: string; apiKey?: string }
  ) {
    this.oldApi = new TonClient({
      endpoint: apiV2Config.apiEndpoint,
      apiKey: apiV2Config.apiKey,
    });
    this.sender = networkProvider.sender();
    this.api = networkProvider.api();
    this.workchain = networkProvider.network() == "testnet" ? 0 : -1;
  }

  open<T extends Contract>(contract: T): OpenedContract<T> {
    return this.networkProvider.open(contract);
  }

  isContractDeployed(address: Address): Promise<boolean> {
    return this.networkProvider.isContractDeployed(address);
  }

  setUp() {
    // nop;
  }
}
