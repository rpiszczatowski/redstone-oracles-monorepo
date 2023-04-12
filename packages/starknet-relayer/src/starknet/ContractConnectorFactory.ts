import { config } from "../config";
import { PriceManagerContractConnector } from "./cairo0/PriceManagerContractConnector";
import { Alpha6PriceManagerContractConnector } from "./alpha6/Alpha6PriceManagerContractConnector";
import { IContractConnector } from "redstone-sdk";
import { IPriceManagerContractAdapter } from "./IPriceManagerContractAdapter";
import { IPriceFeedContractAdapter } from "./IPriceFeedContractAdapter";
import { PriceFeedContractConnector } from "./cairo0/PriceFeedContractConnector";
import { Alpha6PriceFeedContractConnector } from "./alpha6/Alpha6PriceFeedContractConnector";
import { RelayerStarknetContractConnector } from "./RelayerStarknetContractConnector";

export class ContractConnectorFactory {
  static makePriceManagerContractConnector(): IContractConnector<IPriceManagerContractAdapter> &
    RelayerStarknetContractConnector {
    switch (config.priceManagerVersion) {
      case "alpha6":
        return new Alpha6PriceManagerContractConnector(config);
      default:
        return new PriceManagerContractConnector(config);
    }
  }

  static makePriceFeedContractConnector(
    feedAddress: string
  ): IContractConnector<IPriceFeedContractAdapter> {
    switch (config.priceManagerVersion) {
      case "alpha6":
        return new Alpha6PriceFeedContractConnector(config, feedAddress);
      default:
        return new PriceFeedContractConnector(config, feedAddress);
    }
  }
}
