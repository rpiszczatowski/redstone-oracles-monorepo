import { buildRequestHandlersFromContractDetails } from "../../../shared/utils/build-request-handlers-from-contract-details";
import { BalancerRequestHandlers } from "./balancer/BalancerRequestHandlers";
import { balancerTokensContractDetails } from "./balancer/balancerTokensContractDetails";

export const requestHandlers = {
  ...buildRequestHandlersFromContractDetails(
    balancerTokensContractDetails,
    BalancerRequestHandlers
  ),
};
