import { beginCell, Cell } from "ton-core";

export class TonInitData {
  toCell(): Cell {
    return beginCell().endCell();
  }
}
