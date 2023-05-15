import { beginCell, Builder, Cell, TupleBuilder, TupleReader } from "ton-core";
import { OP_NUMBER_BITS } from "./config/operations";
import { DEFAULT_NUM_VALUE_BS } from "redstone-protocol/src/common/redstone-constants";

export function createTupleItems(items: (number | string)[]) {
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

export function createArrayFromSerializedTuple(
  cell: Cell,
  value_size_bits: number = DEFAULT_NUM_VALUE_BS * 8
) {
  // TODO: change it to bigint and in other places too.
  let values: number[] = [];

  const slice = cell.beginParse();
  while (slice.remainingBits > 0) {
    const value = slice.loadInt(value_size_bits);
    values.push(value);
  }

  while (slice.remainingRefs > 0) {
    const c = slice.loadRef();
    values = values.concat(createArrayFromSerializedTuple(c));
  }

  return values;
}

export function messageBuilder(opNumber: bigint): Builder {
  return beginCell().storeUint(opNumber, OP_NUMBER_BITS);
}

export function createArrayFromTuple(result: TupleReader) {
  const values: number[] = [];
  while (result.remaining) {
    values.push(result.readNumber());
  }

  return values;
}
