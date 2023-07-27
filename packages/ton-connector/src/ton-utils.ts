import { Cell, TupleBuilder } from "ton-core";

export function getTuple(items: (number | string)[]) {
  console.warn("Tuple-parameters are not supported yet on real chains");
  const tuple = new TupleBuilder();

  items.forEach((value) => {
    switch (typeof value) {
      case "number":
        tuple.writeNumber(value);
        break;
      case "string":
        tuple.writeNumber(BigInt(value));
        break;
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
