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
  fallbackProvider?: providers.Provider;
}

const MUTLICALL_CONTRACT_ADDRESS = "0x8755b94F88D120AB2Cc13b1f6582329b067C760d";

export class EvmFetcher extends BaseFetcher {
  protected retryForInvalidResponse: boolean = true;

  private multicallContractAddress: string;
  private evmMulticallService: EvmMulticallService;
  private fallbackMulticallService: EvmMulticallService | undefined;
  private requestHandlers: Record<string, IEvmRequestHandlers>;

  constructor(
    name: string,
    providers: Providers,
    multicallContractAddress: string = MUTLICALL_CONTRACT_ADDRESS,
    requestHandlers: Record<string, IEvmRequestHandlers>
  ) {
    super(name);
    this.multicallContractAddress = multicallContractAddress;
    this.evmMulticallService = new EvmMulticallService(
      providers.mainProvider,
      multicallContractAddress
    );
    if (providers.fallbackProvider) {
      this.fallbackMulticallService = new EvmMulticallService(
        providers.fallbackProvider,
        this.multicallContractAddress
      );
    }
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
    try {
      return await this.evmMulticallService.performMulticall(requests);
    } catch (error) {
      this.logger.warn(
        `[${this.name}]: multicall request failed, trying to use fallback provider`
      );
      return await this.tryToRunFallback(error, requests);
    }
  }

  async tryToRunFallback(error: any, requests: MulticallRequest[]) {
    if (!this.fallbackMulticallService) {
      throw error;
    }
    return await this.fallbackMulticallService.performMulticall(requests);
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
