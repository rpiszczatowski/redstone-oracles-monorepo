import { IContractConnector } from "redstone-sdk";
import price_feed_abi from "../../config/price_feed_abi.json";
import { RelayerStarknetContractConnector } from "../RelayerStarknetContractConnector";
import { IPriceFeedContractAdapter } from "../IPriceFeedContractAdapter";
import { Alpha6PriceFeedContractAdapter } from "./Alpha6PriceFeedContractAdapter";

export class Alpha6PriceFeedContractConnector
  extends RelayerStarknetContractConnector
  implements IContractConnector<IPriceFeedContractAdapter>
{
  constructor(config: any, private readonly feedContractAddress: string) {
    super(price_feed_abi, config, feedContractAddress);
  }

  async getAdapter(): Promise<IPriceFeedContractAdapter> {
    return new Alpha6PriceFeedContractAdapter(this.getContract());
  }
}
