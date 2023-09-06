import { OpenedContract } from "ton";
import { SandboxContract } from "@ton-community/sandbox";
import { TonUnitTester } from "./TonUnitTester";
import { Cell } from "ton-core";

export class TonUnitTesterContractAdapter {
  constructor(
    public readonly contract:
      | OpenedContract<TonUnitTester>
      | SandboxContract<TonUnitTester>
  ) {}

  async testGetDataPackageSignerAddress(data: string, signature: string) {
    return this.contract.getTestGetDataPackageSignerAddress(data, signature);
  }

  async testMedian(numbers: number[]) {
    return this.contract.getTestMedian(numbers);
  }

  async testSliceUint(data: string | Cell, byteLength: number) {
    return this.contract.getTestSliceUint(data, byteLength);
  }

  async testSliceInt(data: string | Cell, bitLength: number) {
    return this.contract.getTestSliceInt(data, bitLength);
  }

  async testParseDataPackage(data: string) {
    return this.contract.getTestParseDataPackage(data);
  }

  async testTupleDeserializeIntegers(numbers: (number | string)[]) {
    return this.contract.getTestTupleDeserializeIntegers(numbers);
  }
}
