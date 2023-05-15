import { Ton } from "./Ton";
import { OpenedContract } from "ton";
import { Address } from "ton-core";
import { DeployableContract } from "./DeployableContract";

export abstract class ContractExecutor<
  C extends DeployableContract
> extends Ton {
  openedContract?: OpenedContract<C>;

  constructor(
    private contractType: new (address: Address) => C,
    protected address: string
  ) {
    super();
  }

  async connect(): Promise<ContractExecutor<C>> {
    await super.connect();

    const counterAddress = Address.parse(this.address);
    const counter = new this.contractType(counterAddress);

    this.openedContract = this.client!.open(counter);

    return this;
  }

  perform(): Promise<any> {
    return this.connect();
  }
}
