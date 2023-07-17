import { providers } from "ethers";
import { BaseFetcher } from "../../BaseFetcher";
import { EvmMulticallService } from "./EvmMulticallService";
import { getRequestHandlersForDataFeedId } from "./utils/get-request-handlers-for-data-feed-id";
import {
  MulticallRequest,
  MulticallParsedResponses,
  PricesObj,
} from "../../../types";
import { IEvmRequestHandlers } from "./IEvmRequestHandlers";

interface Providers {
  mainProvider: providers.Provider;
}

const MUTLICALL_CONTRACT_ADDRESS = "0x8755b94F88D120AB2Cc13b1f6582329b067C760d";

export class EvmFetcher extends BaseFetcher {
  protected retryForInvalidResponse: boolean = true;

  private evmMulticallService: EvmMulticallService;
  constructor(
    name: string,
    providers: Providers,
    multicallContractAddress: string = MUTLICALL_CONTRACT_ADDRESS,
    private requestHandlers: Record<string, IEvmRequestHandlers>
  ) {
    super(name);
    this.evmMulticallService = new EvmMulticallService(
      providers.mainProvider,
      multicallContractAddress
    );
    this.requestHandlers = requestHandlers;
  }

  override validateResponse(response: any): boolean {
    return !(response === undefined || response instanceof Error);
  }

  async fetchData(ids: string[]) {
    const requests: MulticallRequest[] = [];
    for (const id of ids) {
      const requestHandlersForId = getRequestHandlersForDataFeedId(
        id,
        this.requestHandlers
      );
      const requestsPerId = requestHandlersForId.prepareMulticallRequest(id);
      requests.push(...requestsPerId);
    }
    return await this.evmMulticallService.performMulticall(requests);
  }

  extractPrices(response: MulticallParsedResponses, ids: string[]): PricesObj {
    return this.extractPricesSafely(ids, (id) => {
      const requestHandlersForId = getRequestHandlersForDataFeedId(
        id,
        this.requestHandlers
      );
      return {
        value: Number(requestHandlersForId.extractPrice(response, id)),
        id,
      };
    });
  }
}
