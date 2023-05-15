import { ContractParamsProvider, IPricesContractAdapter } from "redstone-sdk";
import { TonPriceManager } from "../../wrappers/TonPriceManager";
import { OpenedContract } from "ton";
import { SandboxContract } from "@ton-community/sandbox";

export class TonPriceManagerContractAdapter implements IPricesContractAdapter {
  constructor(
    public readonly contract:
      | OpenedContract<TonPriceManager>
      | SandboxContract<TonPriceManager>
  ) {}

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
    await this.contract.sendWritePrices(paramsProvider);

    return "";
  }

  async readPricesFromContract(
    paramsProvider: ContractParamsProvider
  ): Promise<number[]> {
    return this.contract.getReadPrices(paramsProvider);
  }

  async readTimestampFromContract(): Promise<number> {
    return this.contract.getReadTimestamp();
  }
}
