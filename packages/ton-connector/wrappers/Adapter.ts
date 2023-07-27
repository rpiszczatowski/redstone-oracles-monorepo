import { beginCell, ContractProvider } from "ton-core";
import { TonContract } from "../src/TonContract";
import { createDataPackageCell, createPayloadCell } from "../src/create-cell";
import { splitPayloadHex } from "../src/split-payload-hex";
import { getTuple } from "../src/ton-utils";

export class Adapter extends TonContract {
  static getName(): string {
    return "adapter";
  }

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

  async getPrices(
    provider: ContractProvider,
    dataFeeds: string[],
    payloadHex: string
  ) {
    const payloadCell = createPayloadCell(payloadHex);
    const { dataPackageChunks } = splitPayloadHex(payloadHex);
    for (let i = 0; i < dataPackageChunks.length; i++) {
      const dpCell = createDataPackageCell(dataPackageChunks[i]);
      // const { stack: st } = await provider.get("recover_data_package_address", [
      //   { type: "cell", cell: dpCell },
      // ]);
      //
      // console.log(`${i} ${hexlify(st.readBigNumber())}`);
    }

    const { stack } = await provider.get("get_prices_ts", [
      { type: "tuple", items: getTuple(dataFeeds) },
      { type: "cell", cell: payloadCell },
    ]);

    return stack.readCell();
  }

  async getSort(provider: ContractProvider, items: number[]) {
    const { stack } = await provider.get("perform_sort", [
      { type: "tuple", items: getTuple(items) },
    ]);

    return stack;
  }
}
