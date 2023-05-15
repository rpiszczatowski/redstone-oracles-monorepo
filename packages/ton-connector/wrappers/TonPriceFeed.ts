import { TonContract } from "../src/TonContract";
import { Contract, ContractProvider } from "ton-core";
import { OP_REDSTONE_FETCH_DATA } from "../src/config/operations";
import { createArrayFromTuple, messageBuilder } from "../src/ton-utils";

export class TonPriceFeed extends TonContract implements Contract {
  static getName(): string {
    return "price_feed";
  }

  async getData(provider: ContractProvider) {
    const { stack } = await provider.get("get_price_and_timestamp", []);

    const result = createArrayFromTuple(stack);

    return { value: result[0], timestamp: result[1] };
  }

  async sendFetchData(provider: ContractProvider) {
    const builder = messageBuilder(OP_REDSTONE_FETCH_DATA);
    const body = builder.endCell();

    await this.internalMessage(provider, 0.05, body);
  }
}
