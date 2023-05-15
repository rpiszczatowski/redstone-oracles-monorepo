import { Ton } from "./Ton";
import { TonClient } from "ton";
import { Contract, ContractProvider, Sender } from "ton-core";
import { DeployableContract } from "./DeployableContract";

export class TonDeployer extends Ton {
  constructor(private contract: DeployableContract) {
    super();
  }

  override async perform(): Promise<any> {
    await this.connect();

    await this.wait(() => {
      this.deploy(this.client!, this.walletSender!, this.contract);
    });

    return undefined;
  }

  private async deploy(
    client: TonClient,
    sender: Sender,
    contract: DeployableContract
  ) {
    console.log("contract address:", contract.address.toString());
    if (await client.isContractDeployed(contract.address)) {
      throw "Contract already deployed";
    }

    const counterContract = client.open(contract);
    await counterContract.sendDeploy(sender);
  }
}
