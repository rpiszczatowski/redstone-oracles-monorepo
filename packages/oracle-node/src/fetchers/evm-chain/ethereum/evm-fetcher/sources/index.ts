import { CurveRequestHandlers } from "../../../shared/request-handlers/CurveRequestHandlers";
import { buildRequestHandlersFromContractDetails } from "../../../shared/utils/build-request-handlers-from-contract-details";
import { BalancerRequestHandlers } from "./balancer/BalancerRequestHandlers";
import { balancerTokensContractDetails } from "./balancer/balancerTokensContractDetails";
import { curveTokensContractsDetails } from "./curve-lp-tokens/curveTokensContractsDetails";

export const requestHandlers = {
  ...buildRequestHandlersFromContractDetails(
    balancerTokensContractDetails,
    BalancerRequestHandlers
  ),

  ...buildRequestHandlersFromContractDetails(
    curveTokensContractsDetails,
    CurveRequestHandlers
  ),
};
