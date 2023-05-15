import { DeployableContract } from "./DeployableContract";
import { beginCell, ContractProvider, Sender } from "ton-core";
import { ContractExecutor } from "./ContractExecutor";

export class Feed extends DeployableContract {
  async getFeedValue(provider: ContractProvider) {
    const { stack } = await provider.get("get_feed_value", []);

    return stack.readBigNumber();
  }

  async sendMessage(provider: ContractProvider, via: Sender) {
    const messageBody = beginCell().storeUint(1, 32).storeUint(0, 64);

    const body = messageBody.endCell();
    return await provider.internal(via, {
      value: "0.02", // send 0.02 TON for gas
      body,
    });
  }
}

abstract class FeedContractExecutor extends ContractExecutor<Feed> {
  constructor(address: string) {
    super(Feed, address);
  }
}

export class GetFeedValueFeedContractExecutor extends FeedContractExecutor {
  async perform(): Promise<any> {
    await super.perform();

    return await this.openedContract?.getFeedValue();
  }
}

export class SendMessageFeedContractExecutor extends FeedContractExecutor {
  async perform(): Promise<any> {
    await super.perform();

    await this.wait(() => {
      this.openedContract!.sendMessage(this.walletSender!);
    });
  }
}
