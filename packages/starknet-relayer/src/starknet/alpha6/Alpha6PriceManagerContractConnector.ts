import alpha6_price_manager_abi from "../../config/alpha6_price_manager_abi.json";
import { IPriceManagerContractAdapter } from "../IPriceManagerContractAdapter";
import { Alpha6PriceManagerContractAdapter } from "./Alpha6PriceManagerContractAdapter";
import { Alpha6ContractParamsProvider } from "./Alpha6ContractParamsProvider";
import { IContractConnector } from "redstone-sdk";
import { RelayerStarknetContractConnector } from "../RelayerStarknetContractConnector";
import {
  ALLOWED_SIGNER_ADDRESSES,
  DATA_FEEDS,
  DATA_SERVICE_ID,
  UNIQUE_SIGNER_COUNT,
} from "../../config/data-service-parameters";

export class Alpha6PriceManagerContractConnector
  extends RelayerStarknetContractConnector
  implements IContractConnector<IPriceManagerContractAdapter>
{
  private readonly paramsProvider: Alpha6ContractParamsProvider;

  constructor(config: any) {
    super(alpha6_price_manager_abi, config);

    this.paramsProvider = new Alpha6ContractParamsProvider(
      ALLOWED_SIGNER_ADDRESSES,
      {
        dataServiceId: DATA_SERVICE_ID,
        uniqueSignersCount: UNIQUE_SIGNER_COUNT,
        dataFeeds: DATA_FEEDS,
      }
    );
  }

  async getAdapter(): Promise<IPriceManagerContractAdapter> {
    return new Alpha6PriceManagerContractAdapter(
      this.getContract(),
      this.paramsProvider,
      this.config.maxEthFee
    );
  }
}
