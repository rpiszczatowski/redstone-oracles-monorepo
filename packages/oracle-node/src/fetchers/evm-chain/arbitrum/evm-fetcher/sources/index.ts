import { BeefyTokensRequestHandlers } from "../../../shared/request-handlers/BeefyTokensRequestHandlers";
import { GlpManagerRequestHandler } from "../../../shared/request-handlers/GlpManagerRequestHandlers";
import { YieldYakTokensRequestHandlers } from "../../../shared/request-handlers/YieldYakTokensRequestHandlers";
import { buildRequestHandlersFromContractDetails } from "../../../shared/utils/build-request-handlers-from-contract-details";
import { beefyContractsDetails } from "./beefy/beefyContractsDetails";
import { glpManagerContractsDetails } from "./glp-manager/glpManagerContractsDetails";
import { yieldYakTokensContractsDetails } from "./yield-yak/yieldYakTokensContractsDetails";

export const requestHandlers = {
  ...buildRequestHandlersFromContractDetails(
    glpManagerContractsDetails,
    GlpManagerRequestHandler
  ),

  ...buildRequestHandlersFromContractDetails(
    beefyContractsDetails,
    BeefyTokensRequestHandlers
  ),

  ...buildRequestHandlersFromContractDetails(
    yieldYakTokensContractsDetails,
    YieldYakTokensRequestHandlers
  ),
};
