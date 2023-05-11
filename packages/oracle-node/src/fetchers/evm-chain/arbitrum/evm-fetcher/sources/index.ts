import { buildRequestHandlersFromContractDetails } from "../../../shared/utils/build-request-handlers-from-contract-details";
import { GlpManagerRequestHandler } from "./glp-manager/GlpManagerRequestHandlers";
import { glpManagerContractsDetails } from "./glp-manager";

export const requestHandlers = {
  ...buildRequestHandlersFromContractDetails(
    glpManagerContractsDetails,
    GlpManagerRequestHandler
  ),
};
