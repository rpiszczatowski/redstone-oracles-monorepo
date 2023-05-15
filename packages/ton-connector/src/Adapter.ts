import { beginCell, ContractProvider, Sender } from "ton-core";
import { DeployableContract } from "./DeployableContract";
import { ContractExecutor } from "./ContractExecutor";

export class Adapter extends DeployableContract {
  async sendInit(provider: ContractProvider, via: Sender) {
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

    await provider.internal(via, {
      value: "0.05", // send 0.02 TON for gas
      body,
    });
  }

  async sendMessage(provider: ContractProvider, via: Sender) {
    const messageBody = beginCell()
      .storeUint(101, 32) // op (op #1 = increment)
      .storeUint(0, 64); // query id

    const body = messageBody.endCell();
    await provider.internal(via, {
      value: "0.02", // send 0.02 TON for gas
      body,
    });
  }

  async getKey(provider: ContractProvider, value: number) {
    const { stack } = await provider.get("get_key", [
      { type: "int", value: value as unknown as bigint },
    ]);

    return stack.readBigNumber();
  }
}

abstract class AdapterContractExecutor extends ContractExecutor<Adapter> {
  constructor(protected address: string) {
    super(Adapter, address);
  }
}

export class SendMessageAdapterContractExecutor extends AdapterContractExecutor {
  override async perform() {
    await super.perform();

    await this.wait(() => {
      this.openedContract!.sendMessage(this.walletSender!);
    });
  }
}

export class SendInitAdapterContractExecutor extends AdapterContractExecutor {
  override async perform() {
    await super.perform();

    await this.wait(() => {
      this.openedContract!.sendInit(this.walletSender!);
    });
  }
}

export class GetKeyAdapterContractExecutor extends AdapterContractExecutor {
  override async perform() {
    await super.perform();

    return await this.openedContract?.getKey(333);
  }
}
