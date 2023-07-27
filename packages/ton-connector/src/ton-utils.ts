import { Cell, TupleBuilder } from "ton-core";
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

export function loadCellAsArray(cell: Cell, value_size_bits: number = 256) {
  let values: bigint[] = [];

  const slice = cell.beginParse();
  while (slice.remainingBits > 0) {
    const value = slice.loadIntBig(value_size_bits);
    values.push(value);
  }

  while (slice.remainingRefs > 0) {
    const c = slice.loadRef();
    values = values.concat(loadCellAsArray(c));
  }

  return values;
}
