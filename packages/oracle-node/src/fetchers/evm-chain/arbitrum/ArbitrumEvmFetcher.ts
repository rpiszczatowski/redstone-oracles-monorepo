import { providers } from "ethers";
import { BaseFetcher } from "../../BaseFetcher";
import { EvmMulticallService } from "../EvmMulticallService";
import { prepareMulticallRequests } from "./prepare-multicall-request";
import { MulticallParsedResponses, PricesObj } from "../../../types";
import { extractPrice } from "./extract-price";
import { stringifyError } from "../../../utils/error-stringifier";

const MUTLICALL_CONTRACT_ADDRESS = "0x842eC2c7D803033Edf55E478F461FC547Bc54EB2";

export class ArbitrumEvmFetcher extends BaseFetcher {
  protected retryForInvalidResponse: boolean = true;

  private evmMulticallService: EvmMulticallService;

  constructor(
    provider: providers.Provider,
    multicallContractAddress: string = MUTLICALL_CONTRACT_ADDRESS
  ) {
    super("arbitrum-evm-fetcher");
    this.evmMulticallService = new EvmMulticallService(
      provider,
      multicallContractAddress
    );
  }

  override validateResponse(response: any): boolean {
    return !(response === undefined || response instanceof Error);
  }

  async fetchData(ids: string[]) {
    const requests = [];
    for (const id of ids) {
      const requestsPerId = prepareMulticallRequests(id);
      requests.push(...requestsPerId);
    }
    try {
      return await this.evmMulticallService.performMulticall(requests);
    } catch (error) {
      return error;
    }
  }

  extractPrices(response: MulticallParsedResponses, ids: string[]): PricesObj {
    const pricesObject: PricesObj = {};
    for (const id of ids) {
      try {
        const price = extractPrice(response, id);
        if (price) {
          pricesObject[id] = Number(price);
        }
      } catch (e: any) {
        this.logger.error(
          `Extracting price failed for: ${id}. ${stringifyError(e)}`
        );
      }
    }
    return pricesObject;
  }
}
