import { TonContractConnector } from "../src/TonContractConnector";
import { beginCell, Contract, ContractProvider } from "ton-core";

export class Feed extends TonContractConnector implements Contract {
  static getName(): string {
    return "feed";
  }

  async getFeedValue(provider: ContractProvider) {
    const { stack } = await provider.get("get_feed_value", []);

    return stack.readBigNumber();
  }

  async sendFetchFeedValue(provider: ContractProvider) {
    const messageBody = beginCell().storeUint(1, 32).storeUint(0, 64);

    const body = messageBody.endCell();

    await this.internalMessage(provider, 0.02, body);
  }
}
