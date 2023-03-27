import { providers } from "ethers";
import { BaseFetcher } from "../../BaseFetcher";
import { EvmMulticallService } from "../EvmMulticallService";
import { prepareMulticallRequests } from "./prepare-multicall-request";
import { yieldYakContractsDetails } from "./contracts-details/yield-yak";
import { lpTokensContractsDetails } from "./contracts-details/lp-tokens";
import { mooTokensContractsDetails } from "./contracts-details/moo-joe";
import {
  MulticallParsedResponses,
  MulticallRequest,
  PricesObj,
} from "../../../types";
import { extractPrice } from "./extract-price";
import { oracleAdaptersContractsDetails } from "./contracts-details/oracle-adapters";
import { stringifyError } from "../../../utils/error-stringifier";

interface Providers {
  avalancheProvider: providers.Provider;
  fallbackProvider?: providers.Provider;
}

export type YieldYakDetailsKeys = keyof typeof yieldYakContractsDetails;
export type LpTokensDetailsKeys = keyof typeof lpTokensContractsDetails;
export type MooJoeTokensDetailsKeys = keyof typeof mooTokensContractsDetails;
export type OracleAdaptersDetailsKeys =
  keyof typeof oracleAdaptersContractsDetails;

export const yyTokenIds = Object.keys(yieldYakContractsDetails);
export const lpTokensIds = Object.keys(lpTokensContractsDetails);
export const mooTokens = Object.keys(mooTokensContractsDetails);
export const oracleAdaptersTokens = Object.keys(oracleAdaptersContractsDetails);

const MUTLICALL_CONTRACT_ADDRESS = "0x8755b94F88D120AB2Cc13b1f6582329b067C760d";

export class AvalancheEvmFetcher extends BaseFetcher {
  protected retryForInvalidResponse: boolean = true;

  private multicallContractAddress: string;
  private evmMulticallService: EvmMulticallService;
  private fallbackMulticallService: EvmMulticallService | undefined;

  constructor(
    providers: Providers,
    multicallContractAddress: string = MUTLICALL_CONTRACT_ADDRESS
  ) {
    super("avalanche-evm-fetcher");
    this.multicallContractAddress = multicallContractAddress;
    this.evmMulticallService = new EvmMulticallService(
      providers.avalancheProvider,
      multicallContractAddress
    );
    if (providers.fallbackProvider) {
      this.fallbackMulticallService = new EvmMulticallService(
        providers.fallbackProvider,
        this.multicallContractAddress
      );
    }
  }

  override validateResponse(response: any): boolean {
    return !(response === undefined || response instanceof Error);
  }

  async fetchData(ids: string[]) {
    const requests: MulticallRequest[] = [];
    for (const id of ids) {
      const requestsPerId = prepareMulticallRequests(id);
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
    const pricesObject: PricesObj = {};
    for (const id of ids) {
      try {
        const price = extractPrice(response, id);
        this.logger.info(`Extracted price for ${id}: ${price}`);
        if (price) {
          pricesObject[id] = Number(price);
        }
      } catch (err: any) {
        const errMsg = stringifyError(err);
        this.logger.error(
          `Error during extracting price. Id: ${id}. Err: ${errMsg}`
        );
      }
    }
    return pricesObject;
  }
}
