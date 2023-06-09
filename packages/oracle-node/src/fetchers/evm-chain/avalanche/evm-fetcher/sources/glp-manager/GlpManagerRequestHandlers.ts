import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-value-from-multicall-response";
import { glpManagerContractsDetails } from "./glpManagerContractsDetails";
import { MulticallParsedResponses } from "../../../../../../types";
import {
  GLP_MANAGER_PRICE_PRECISION,
  TEN_AS_BASE_OF_POWER,
} from "../../../../shared/contants";

export type GlpManagerDetailsKeys = keyof typeof glpManagerContractsDetails;

export class GlpManagerRequestHandler implements IEvmRequestHandlers {
  prepareMulticallRequest(id: GlpManagerDetailsKeys) {
    const { abi, address } = glpManagerContractsDetails[id];
    const functionsNamesWithValues = [{ name: "getPrice", values: ["false"] }];
    return buildMulticallRequests(abi, address, functionsNamesWithValues);
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: GlpManagerDetailsKeys
  ): number | undefined {
    const { address } = glpManagerContractsDetails[id];
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
