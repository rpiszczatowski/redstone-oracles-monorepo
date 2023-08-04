import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Sender,
} from "ton-core";
import { compile, NetworkProvider } from "@ton-community/blueprint";
import * as fs from "fs";
import { TonConnector } from "./TonConnector";
import { Maybe } from "ton-core/src/utils/maybe";

export class TonContractConnector extends TonConnector implements Contract {
  static getName(): string {
    throw "Must be overridden; Return the contract-filename here;";
  }

  constructor(
    readonly address: Address,
    readonly init?: Maybe<{ code: Cell; data: Cell }>
  ) {
    super();
  }

  async sendDeploy(provider: ContractProvider) {
    console.log("contract address:", this.address.toString());

    await this.internalMessage(provider, 0.05, beginCell().endCell());
  }

  static async openForExecute<T>(networkProvider: NetworkProvider): Promise<T> {
    const address = await fs.promises.readFile(
      `deploy/${this.getName()}.address`,
      "utf8"
    );

    const contract = new this(Address.parse(address));

    await contract.connect(networkProvider);

    return contract as unknown as T;
  }

  static async openForDeploy<T>(
    networkProvider: NetworkProvider,
    workchain: number = 0
  ) {
    const code = await compile("Adapter");

    const { address, contract } = this.openContractCode(code, workchain);

    fs.writeFile(
      `deploy/${this.getName()}.address`,
      address.toString(),
      (err) => {
        if (err) {
          throw `Error while saving address file: ${err}`;
        }
      }
    );

    if (await networkProvider.isContractDeployed(address)) {
      throw "Contract already deployed";
    }

    await contract.connect(networkProvider);

    return contract as unknown as T;
  }

  static openForTest<T>(code: Cell, sender: Sender, workchain: number = 0) {
    const { contract } = this.openContractCode(code, workchain);

    contract.sender = sender;

    return contract as unknown as T;
  }

  private static openContractCode<T extends Contract>(
    code: Cell,
    workchain: number
  ) {
    const data = beginCell().endCell();
    const address = contractAddress(workchain, { code, data });
    const contract = new this(address, { code, data });

    return { address, contract };
  }
}
