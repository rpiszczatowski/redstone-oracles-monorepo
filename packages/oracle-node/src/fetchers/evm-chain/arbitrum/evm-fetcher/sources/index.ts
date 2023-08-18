import { GlpManagerRequestHandler } from "../../../shared/request-handlers/GlpManagerRequestHandlers";
import { buildRequestHandlersFromContractDetails } from "../../../shared/utils/build-request-handlers-from-contract-details";
import { glpManagerContractsDetails } from "./glp-manager/glpManagerContractsDetails";

export const requestHandlers = {
  ...buildRequestHandlersFromContractDetails(
    glpManagerContractsDetails,
    GlpManagerRequestHandler
  ),
};
