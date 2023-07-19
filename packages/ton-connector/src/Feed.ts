import { TonContract } from "./TonContract";
import { beginCell, ContractProvider } from "ton-core";

export class Feed extends TonContract {
  async getFeedValue(provider: ContractProvider) {
    await this.connect();

    const { stack } = await provider.get("get_feed_value", []);

    return stack.readBigNumber();
  }

  async sendMessage(provider: ContractProvider) {
    const messageBody = beginCell().storeUint(1, 32).storeUint(0, 64);

    const body = messageBody.endCell();

    await this.internalMessage(provider, 0.02, body);
  }
}
