import { providers } from "ethers";
import { BaseFetcher } from "../../BaseFetcher";
import { EvmMulticallService } from "../EvmMulticallService";
import { prepareMulticallRequests } from "./prepare-multicall-request";
import { yieldYakContractsDetails } from "./contracts-details/yield-yak";
import { lpTokensContractsDetails } from "./contracts-details/lp-tokens";
import { mooTokensContractsDetails } from "./contracts-details/moo-joe";
import { MulticallParsedResponses, PricesObj } from "../../../types";
import { extractPrice } from "./extract-price";
import { oracleAdaptersContractsDetails } from "./contracts-details/oracle-adapters";
import { glpManagerContractsDetails } from "./contracts-details/glp-manager";

export type YieldYakDetailsKeys = keyof typeof yieldYakContractsDetails;
export type LpTokensDetailsKeys = keyof typeof lpTokensContractsDetails;
export type MooJoeTokensDetailsKeys = keyof typeof mooTokensContractsDetails;
export type OracleAdaptersDetailsKeys =
  keyof typeof oracleAdaptersContractsDetails;
export type GlpManagerDetailsKeys = keyof typeof glpManagerContractsDetails;

export const yyTokenIds = Object.keys(yieldYakContractsDetails);
export const lpTokensIds = Object.keys(lpTokensContractsDetails);
export const mooTokens = Object.keys(mooTokensContractsDetails);
export const oracleAdaptersTokens = Object.keys(oracleAdaptersContractsDetails);
export const glpToken = Object.keys(glpManagerContractsDetails);

const MUTLICALL_CONTRACT_ADDRESS = "0x8755b94F88D120AB2Cc13b1f6582329b067C760d";

export class AvalancheEvmFetcher extends BaseFetcher {
  private evmMulticallService: EvmMulticallService;

  constructor(
    provider: providers.Provider,
    multicallContractAddress: string = MUTLICALL_CONTRACT_ADDRESS
  ) {
    super("avalanche-evm-fetcher");
    this.evmMulticallService = new EvmMulticallService(
      provider,
      multicallContractAddress
    );
  }

  async fetchData(ids: string[]) {
    const requests = [];
    for (const id of ids) {
      const requestsPerId = prepareMulticallRequests(id);
      requests.push(...requestsPerId);
    }
    return await this.evmMulticallService.performMulticall(requests);
  }

  async extractPrices(
    response: MulticallParsedResponses,
    ids: string[]
  ): Promise<PricesObj> {
    const pricesObject: PricesObj = {};
    for (const id of ids) {
      const price = await extractPrice(response, id);
      if (price) {
        pricesObject[id] = Number(price);
      }
    }
    return pricesObject;
  }
}
