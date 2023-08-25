import { OpenedContract } from "ton";
import { SandboxContract } from "@ton-community/sandbox";
import { TonTester } from "./TonTester";
import { ContractParamsProvider } from "redstone-sdk";

export class TonTesterContractAdapter {
  constructor(
    public readonly contract:
      | OpenedContract<TonTester>
      | SandboxContract<TonTester>
  ) {}

  async testProcessPayload(
    paramsProvider: ContractParamsProvider,
    signers: string[],
    uniqueSignersThreshold: number,
    currentTimestamp: number
  ) {
    return this.contract.getTestProcessPayload(
      paramsProvider,
      signers,
      uniqueSignersThreshold,
      currentTimestamp
    );
  }
}
