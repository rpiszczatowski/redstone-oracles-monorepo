import { beginCell, Cell, serializeTuple } from "ton-core";
import { createTupleItems } from "../ton-utils";
import { TIMESTAMP_BS } from "redstone-protocol/src/common/redstone-constants";
import { TonInitData } from "../TonInitData";

export class PriceManagerInitData implements TonInitData {
  constructor(
    private signer_count_threshold: number,
    private signers: string[]
  ) {}

  toCell(): Cell {
    return beginCell()
      .storeUint(this.signer_count_threshold, 8)
      .storeUint(0, TIMESTAMP_BS * 8)
      .storeRef(serializeTuple(createTupleItems(this.signers)))
      .storeRef(beginCell().endCell())
      .endCell();
  }
}
