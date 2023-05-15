import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Sender,
} from "ton-core";
import fs from "fs";

export class DeployableContract implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createForDeploy(
    name: string,
    workchain: number = 0
  ): DeployableContract {
    const code = Cell.fromBoc(fs.readFileSync(`func/${name}.cell`))[0];

    const data = beginCell().endCell();
    const address = contractAddress(workchain, { code, data });

    fs.writeFile(`deploy/${name}.address`, address.toString(), (err) => {
      if (err) {
        throw `Error while saving address file: ${err}`;
      }
    });

    return new DeployableContract(address, { code, data });
  }

  async sendDeploy(provider: ContractProvider, via: Sender) {
    await provider.internal(via, {
      value: "0.02", // send 0.01 TON to contract for rent
      bounce: false,
    });
  }
}
