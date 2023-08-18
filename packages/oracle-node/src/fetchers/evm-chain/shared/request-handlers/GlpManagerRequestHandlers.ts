import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../IEvmRequestHandlers";
import { buildMulticallRequests } from "../utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../utils/extract-value-from-multicall-response";
import { getContractDetailsFromConfig } from "../utils/get-contract-details-from-config";
import { GLP_MANAGER_PRICE_PRECISION, TEN_AS_BASE_OF_POWER } from "../contants";
import { MulticallParsedResponses } from "../../../../types";

interface TokenContractDetails {
  abi: string;
  address: string;
}
type GlpTokenContractsDetails = Record<string, TokenContractDetails>;

export class GlpManagerRequestHandler implements IEvmRequestHandlers {
  constructor(
    private readonly glpManagerContractsDetails: GlpTokenContractsDetails
  ) {}
  prepareMulticallRequest(id: string) {
    const { abi, address } = getContractDetailsFromConfig(
      this.glpManagerContractsDetails,
      id
    );

    const functionsNamesWithValues = [{ name: "getPrice", values: ["false"] }];
    return buildMulticallRequests(abi, address, functionsNamesWithValues);
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: string
  ): number | undefined {
    const { address } = getContractDetailsFromConfig(
      this.glpManagerContractsDetails,
      id
    );

    const value = new Decimal(
      extractValueFromMulticallResponse(response, address, "getPrice")
    );
    const divider = new Decimal(TEN_AS_BASE_OF_POWER).toPower(
      GLP_MANAGER_PRICE_PRECISION
    );
    const valueSerialized = value.div(divider);
    return valueSerialized.toNumber();
  }
}
