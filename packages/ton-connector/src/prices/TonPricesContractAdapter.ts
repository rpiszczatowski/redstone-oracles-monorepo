import { ContractParamsProvider, IPricesContractAdapter } from "redstone-sdk";
import { Adapter } from "../../wrappers/Adapter";
import { OpenedContract } from "ton";
import { SandboxContract } from "@ton-community/sandbox";

export class TonPricesContractAdapter implements IPricesContractAdapter {
  constructor(
    private contract: OpenedContract<Adapter> | SandboxContract<Adapter>
  ) {}

  async getKey(value: number): Promise<bigint> {
    return this.contract.getKey(value);
  }

  async sendInit(): Promise<any> {
    return this.contract.sendInit();
  }

  async sendDeploy(): Promise<any> {
    return this.contract.sendDeploy();
  }

  async getPricesFromPayload(
    paramsProvider: ContractParamsProvider
  ): Promise<number[]> {
    return this.contract.getPrices(paramsProvider);
  }

  async writePricesFromPayloadToContract(
    paramsProvider: ContractParamsProvider
  ): Promise<string | number[]> {
    throw "Not implemented yet";
  }

  async readPricesFromContract(
    paramsProvider: ContractParamsProvider
  ): Promise<number[]> {
    throw "Not implemented yet";
  }

  async readTimestampFromContract(): Promise<number> {
    throw "Not implemented yet";
  }
}
