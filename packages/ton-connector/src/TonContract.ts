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

export class TonContract extends Ton implements Contract {
  private openedContract!: OpenedContract<this>;

  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {
    super();
  }

  static async createForExecute<T>(
    address: string
  ): Promise<OpenedContract<T>> {
    const contract = new this(Address.parse(address));
    await contract.connect();

    return contract.openedContract as unknown as OpenedContract<T>;
  }

  static async createForDeploy(name: string, workchain: number = 0) {
    const code = Cell.fromBoc(fs.readFileSync(`func/${name}.cell`))[0];

    const data = beginCell().endCell();
    const address = contractAddress(workchain, { code, data });

    fs.writeFile(`deploy/${name}.address`, address.toString(), (err) => {
      if (err) {
        throw `Error while saving address file: ${err}`;
      }
    });

    const contract = new this(address, { code, data });

    await contract.connect();

    return contract.openedContract;
  }

  async connect(): Promise<this> {
    await super.connect();

    this.openedContract = this.client!.open(this);

    return this;
  }

  async sendDeploy(provider: ContractProvider) {
    await this.connect();

    console.log("contract address:", this.openedContract.address.toString());
    if (await this.client!.isContractDeployed(this.openedContract.address)) {
      throw "Contract already deployed";
    }

    await this.internalMessage(provider, 0.02, undefined, false);
  }
}
