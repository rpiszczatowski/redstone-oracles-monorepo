import { TonContract } from "../../src/TonContract";
import { createBuilderFromString, createTupleItems } from "../../src/ton-utils";

import { Cell, ContractProvider } from "ton-core";
import { hexlify } from "ethers/lib/utils";

export class TonUnitTester extends TonContract {
  async getTestGetDataPackageSignerAddress(
    provider: ContractProvider,
    data: string,
    signature: string
  ) {
    const { stack } = await provider.get(
      "test_get_data_package_signer_address",
      [
        {
          type: "slice",
          cell: createBuilderFromString(data).asCell(),
        },
        {
          type: "slice",
          cell: createBuilderFromString(signature).asCell(),
        },
      ]
    );

    return hexlify(stack.readBigNumber()).toLowerCase();
  }

  async getTestMedian(provider: ContractProvider, numbers: number[]) {
    const { stack } = await provider.get("test_median", [
      {
        type: "tuple",
        items: createTupleItems(numbers),
      },
    ]);

    return stack.readNumber();
  }

  async getTestSliceInt(
    provider: ContractProvider,
    data: string | Cell,
    length: number
  ) {
    const { stack } = await provider.get("test_slice_int", [
      {
        type: "slice",
        cell:
          typeof data == "string"
            ? createBuilderFromString(data).asCell()
            : data,
      },
      {
        type: "int",
        value: BigInt(length * 8),
      },
    ]);

    return { slice: stack.readCell(), value: stack.readBigNumber() };
  }

  async getTestParseDataPackage(provider: ContractProvider, data: string) {
    const { stack } = await provider.get("test_parse_data_package", [
      {
        type: "slice",
        cell: createBuilderFromString(data).asCell(),
      },
    ]);

    return {
      feedId: stack.readBigNumber(),
      value: stack.readBigNumber(),
      timestamp: stack.readNumber(),
    };
  }
}
