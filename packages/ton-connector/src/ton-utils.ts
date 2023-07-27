import { TupleBuilder } from "ton-core";
import { hexlify, toUtf8Bytes } from "ethers/lib/utils";

export function getTuple<T>(items: T[]) {
  const tuple = new TupleBuilder();

  items.forEach((value) => {
    switch (typeof value) {
      case "number":
        tuple.writeNumber(value);
        break;
      case "string":
        tuple.writeNumber(BigInt(hexlify(toUtf8Bytes(value))));
        break;
      default:
        throw `Not implemented for '${typeof value}'`;
    }
  });

  return tuple.build();
}
