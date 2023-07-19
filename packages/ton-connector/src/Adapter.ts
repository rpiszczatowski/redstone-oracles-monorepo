import { beginCell, ContractProvider } from "ton-core";
import { TonContract } from "./TonContract";
import { arrayify, hexlify } from "ethers/lib/utils";
import { requestRedstonePayload } from "redstone-sdk";
import {
  DATA_FEED_ID_BS,
  DATA_POINT_VALUE_BYTE_SIZE_BS,
  DATA_POINTS_COUNT_BS,
  DEFAULT_NUM_VALUE_BS,
  SIGNATURE_BS,
  TIMESTAMP_BS,
} from "redstone-protocol/dist/src/common/redstone-constants";

export class Adapter extends TonContract {
  async sendInit(provider: ContractProvider) {
    const messageBody = beginCell()
      .storeUint(1, 32) // op (op #1 = increment)
      .storeUint(0, 64); // query id

    for (let i = 0; i < 4; i++) {
      const cell = beginCell()
        .storeUint((i + 1) * 111, 256)
        .storeUint((i + 1) * 100000, 256)
        .endCell();
      messageBody.storeRef(cell);
    }

    const body = messageBody.endCell();

    await this.internalMessage(provider, 0.05, body);
  }

  async sendMessage(provider: ContractProvider) {
    const messageBody = beginCell()
      .storeUint(101, 32) // op (op #1 = increment)
      .storeUint(0, 64); // query id

    const body = messageBody.endCell();

    await this.internalMessage(provider, 0.02, body);
  }

  async getKey(provider: ContractProvider, value: number) {
    const { stack } = await provider.get("get_key", [
      { type: "int", value: value as unknown as bigint },
    ]);

    return stack.readBigNumber();
  }

  async getRecover(provider: ContractProvider) {
    const hash = BigInt(
      "0x164f3132baee84bf9ed8fd6b283bc381dc94595a2cc7a9b8bd551d2174137e7e"
    );
    const signature = beginCell()
      .storeUint(
        BigInt(
          "0x690fb11e5d8a166c79a7537c37b804f06afc6b0c41570a8f77c7a5deb882b1da"
        ),
        256
      )
      .storeUint(
        BigInt(
          "0x118bfc9ada56a7ed8104a59916ad886faba493d327c4374624e73f4ede4e5aba"
        ),
        256
      )
      .storeUint(BigInt("0x1b"), 8)
      .endCell();

    const { stack } = await provider.get("recover", [
      { type: "int", value: hash },
      { type: "cell", cell: signature },
    ]);

    return stack.readBigNumber();
  }

  async getVerify(provider: ContractProvider) {
    const payload = await requestRedstonePayload({
      dataServiceId: "redstone-primary-prod",
      uniqueSignersCount: 1,
      dataFeeds: ["SWETH"],
    });

    const SINGLE_POINT_PACKAGE_SIZE =
      DATA_FEED_ID_BS +
      DEFAULT_NUM_VALUE_BS +
      TIMESTAMP_BS +
      DATA_POINTS_COUNT_BS +
      DATA_POINT_VALUE_BYTE_SIZE_BS;
    const data = payload.substring(0, 2 * SINGLE_POINT_PACKAGE_SIZE);
    const signature = payload.substring(
      2 * SINGLE_POINT_PACKAGE_SIZE,
      2 * SINGLE_POINT_PACKAGE_SIZE + 2 * SIGNATURE_BS
    );

    const signature_cell = beginCell()
      .storeUint(BigInt("0x" + signature.substring(0, 64)), 256)
      .storeUint(BigInt("0x" + signature.substring(64, 128)), 256)
      .storeUint(BigInt("0x" + signature.substring(128, 130)), 8)
      .endCell();

    const data_cell = beginCell()
      .storeBuffer(Buffer.from(arrayify("0x" + data)))
      .endCell();

    const { stack } = await provider.get("verify", [
      { type: "slice", cell: data_cell },
      { type: "cell", cell: signature_cell },
    ]);

    return hexlify(stack.readBigNumber());
  }
}
