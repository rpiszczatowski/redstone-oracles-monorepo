import { Blockchain, SandboxContract } from "@ton-community/sandbox";
import { Cell } from "ton-core";
import { Adapter } from "../wrappers/Adapter";
import { IPricesContractAdapter } from "redstone-sdk";
import { TonPricesContractAdapter } from "../src/prices/TonPricesContractAdapter";

export class TestTonPricesContractConnector {
  constructor(
    private blockchain: Blockchain,
    private code: Cell,
    private workchain: number = 0
  ) {}

  async getContract(): Promise<SandboxContract<Adapter>> {
    const deployer = await this.blockchain.treasury("deployer");

    const contract = await Adapter.openForTest<Adapter>(
      this.code,
      deployer.getSender(),
      this.workchain
    );

    const openedContract = this.blockchain.openContract(contract);

    await openedContract.sendTestDeploy();

    return openedContract;
  }

  async getAdapter(): Promise<IPricesContractAdapter> {
    return new TonPricesContractAdapter(await this.getContract());
  }
}
