import {
  CurveRequestHandlers,
  TokenContractDetails,
  TokenContractDetailsObject,
} from "../../../shared/request-handlers/CurveRequestHandlers";
import {
  buildRequestHandlersFromContractDetails,
  Class,
} from "../../../shared/utils/build-request-handlers-from-contract-details";
import { curveTokensContractsDetails } from "./curve-lp-tokens/curveTokensContractsDetails";
import { LidoTokensRequestHandlers } from "./lido/LidoTokensRequestHandlers";
import { lidoTokensContractDetails } from "./lido/lidoTokensContractDetails";
import { IEvmRequestHandlers } from "../../../shared/IEvmRequestHandlers";

export const requestHandlers = {
  ...buildRequestHandlersFromContractDetails(
    curveTokensContractsDetails as unknown as TokenContractDetailsObject,
    CurveRequestHandlers as unknown as Class<
      IEvmRequestHandlers,
      TokenContractDetails
    >
  ),

  ...buildRequestHandlersFromContractDetails(
    lidoTokensContractDetails,
    LidoTokensRequestHandlers
  ),
};
