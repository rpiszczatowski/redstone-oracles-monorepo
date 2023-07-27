import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Sender,
} from "ton-core";
import { NetworkProvider } from "@ton-community/blueprint";
import * as fs from "fs";
import { TonConnector } from "./TonConnector";

export class TonContractConnector extends TonConnector {
  static getName(): string {
    throw "Must be overridden; Return the contract-filename here;";
  }

  constructor(readonly address: Address) {
    super();
  }

  static async openForExecute<T>(): Promise<T> {
    const address = await fs.promises.readFile(
      `deploy/${this.getName()}.address`,
      "utf8"
    );

    const contract = new this(Address.parse(address));

    return contract as unknown as T;
  }

  static async openForDeploy(
    networkProvider: NetworkProvider,
    workchain: number = 0
  ) {
    const code = Cell.fromBoc(
      fs.readFileSync(`contracts/${this.getName()}.cell`)
    )[0];

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

    return contract;
  }

  static openForTest<T>(code: Cell, sender: Sender, workchain: number = 0) {
    const { contract } = this.openContractCode(code, workchain);

    contract.walletSender = sender;

    return contract as unknown as T;
  }

  async sendDeploy(provider: ContractProvider) {
    console.log("contract address:", this.address.toString());

    // if (await this.client!.isContractDeployed(this.address)) {
    //   throw "Contract already deployed";
    // }

    await this.internalMessage(provider, 0.02, undefined);
  }

  async sendTestDeploy(provider: ContractProvider) {
    await provider.internal(this.walletSender!, { value: "0.02" });
  }

  private static openContractCode<T extends Contract>(
    code: Cell,
    workchain: number
  ) {
    const data = beginCell().endCell();
    const address = contractAddress(workchain, { code, data });
    const contract = new this(address);

    return { address, contract };
  }
}
