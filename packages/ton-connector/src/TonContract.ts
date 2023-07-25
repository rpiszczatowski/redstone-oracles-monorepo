import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
} from "ton-core";
import fs from "fs";
import { Ton } from "./Ton";
import { OpenedContract } from "ton";
import { NetworkProvider } from "@ton-community/blueprint";

export class TonContract extends Ton implements Contract {
  private openedContract!: OpenedContract<this>;

  static getName(): string {
    throw "Must be overridden";
  }

  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {
    super();
  }

  static async openForExecute<T>(
    networkProvider: NetworkProvider
  ): Promise<OpenedContract<T>> {
    const address = await fs.promises.readFile(
      `deploy/${this.getName()}.address`,
      "utf8"
    );

    const contract = new this(Address.parse(address));
    await contract.connect(networkProvider);

    return contract.openedContract as unknown as OpenedContract<T>;
  }

  static async openForDeploy(
    networkProvider: NetworkProvider,
    workchain: number = 0
  ) {
    const code = Cell.fromBoc(
      fs.readFileSync(`contracts/${this.getName()}.cell`)
    )[0];

    const data = beginCell().endCell();
    const address = contractAddress(workchain, { code, data });

    fs.writeFile(
      `deploy/${this.getName()}.address`,
      address.toString(),
      (err) => {
        if (err) {
          throw `Error while saving address file: ${err}`;
        }
      }
    );

    const contract = new this(address, { code, data });

    await contract.connect(networkProvider);

    return contract.openedContract;
  }

  override async connect(networkProvider: NetworkProvider): Promise<this> {
    await super.connect(networkProvider);

    this.openedContract = this.client!.open(this);

    return this;
  }

  async sendDeploy(provider: ContractProvider) {
    console.log("contract address:", this.openedContract.address.toString());
    if (await this.client!.isContractDeployed(this.openedContract.address)) {
      throw "Contract already deployed";
    }

    await this.internalMessage(provider, 0.02, undefined);
  }
}