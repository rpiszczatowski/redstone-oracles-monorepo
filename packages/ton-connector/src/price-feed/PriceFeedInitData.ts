import { Address, beginCell, Cell } from "ton-core";
import { hexlify, toUtf8Bytes } from "ethers/lib/utils";
import {
  DATA_FEED_ID_BS,
  DEFAULT_NUM_VALUE_BS,
  TIMESTAMP_BS,
} from "redstone-protocol/src/common/redstone-constants";
import { TonInitData } from "../TonInitData";

export class PriceFeedInitData implements TonInitData {
  constructor(private feed_id: string, private manager_address: string) {}

  toCell(): Cell {
    return beginCell()
      .storeUint(
        BigInt(hexlify(toUtf8Bytes(this.feed_id))),
        DATA_FEED_ID_BS * 8
      )
      .storeAddress(Address.parse(this.manager_address))
      .storeUint(0, DEFAULT_NUM_VALUE_BS * 8)
      .storeUint(0, TIMESTAMP_BS * 8)
      .endCell();
  }
}
