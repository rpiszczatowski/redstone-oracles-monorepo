import {
  buildRequestHandlersFromContractDetails,
  Class,
} from "../../../shared/utils/build-request-handlers-from-contract-details";
import { YieldYakTokensRequestHandlers } from "../../../shared/request-handlers/YieldYakTokensRequestHandlers";
import { yieldYakTokensContractsDetails } from "./yield-yak/yieldYakTokensContractsDetails";
import { DexLpTokensRequestHandlers } from "../../../shared/request-handlers/DexLpTokensRequestHandlers";
import { dexLpTokensContractsDetails } from "./dex-lp-tokens/dexLpTokensContractsDetails";
import { BeefyTokensRequestHandlers } from "../../../shared/request-handlers/BeefyTokensRequestHandlers";
import { beefyContractsDetails } from "./beefy/beefyContractsDetails";
import { OracleAdapterRequestHandlers } from "./oracle-adapter/OracleAdapterRequestHandlers";
import { oracleAdapterContractsDetails } from "./oracle-adapter/oracleAdapterContractsDetails";
import { GlpManagerRequestHandler } from "../../../shared/request-handlers/GlpManagerRequestHandlers";
import { glpManagerContractsDetails } from "./glp-manager/glpManagerContractsDetails";
import { steakHutTokensContractDetails } from "./steak-hut/steakHutTokensContractDetails";
import { SteakHutTokensRequestHandlers } from "./steak-hut/SteakHutTokensRequestHandler";
import { gmdTokensContractsDetails } from "./gmd/gmdTokensContractsDetails";
import { GmdRequestHandler } from "./gmd/GmdRequestHandlers";
import { traderJoeAutoPoolTokenContractDetails } from "./trader-joe-auto/traderJoeAutoPoolTokenContractsDetails";
import { TraderJoeAutoRequestHandlers } from "./trader-joe-auto/TraderJoeAutoRequestHandlers";
import { curveTokensContractsDetails } from "./curve-lp-tokens/curveTokensContractsDetails";
import {
  CurveRequestHandlers,
  TokenContractDetails,
  TokenContractDetailsObject,
} from "../../../shared/request-handlers/CurveRequestHandlers";
import { balancerTokensContractDetails } from "./balancer/balancerTokensContractDetails";
import { BalancerRequestHandlers } from "./balancer/BalancerRequestHandlers";
import { IEvmRequestHandlers } from "../../../shared/IEvmRequestHandlers";

export const requestHandlers = {
  ...buildRequestHandlersFromContractDetails(
    yieldYakTokensContractsDetails,
    YieldYakTokensRequestHandlers
  ),
  ...buildRequestHandlersFromContractDetails(
    dexLpTokensContractsDetails,
    DexLpTokensRequestHandlers
  ),
  ...buildRequestHandlersFromContractDetails(
    beefyContractsDetails,
    BeefyTokensRequestHandlers
  ),
  ...buildRequestHandlersFromContractDetails(
    oracleAdapterContractsDetails,
    OracleAdapterRequestHandlers
  ),
  ...buildRequestHandlersFromContractDetails(
    glpManagerContractsDetails,
    GlpManagerRequestHandler
  ),
  ...buildRequestHandlersFromContractDetails(
    steakHutTokensContractDetails,
    SteakHutTokensRequestHandlers
  ),
  ...buildRequestHandlersFromContractDetails(
    gmdTokensContractsDetails.contractDetails,
    GmdRequestHandler
  ),
  ...buildRequestHandlersFromContractDetails(
    traderJoeAutoPoolTokenContractDetails,
    TraderJoeAutoRequestHandlers
  ),
  ...buildRequestHandlersFromContractDetails(
    curveTokensContractsDetails as TokenContractDetailsObject,
    CurveRequestHandlers as unknown as Class<
      IEvmRequestHandlers,
      TokenContractDetails
    >
  ),
  ...buildRequestHandlersFromContractDetails(
    balancerTokensContractDetails,
    BalancerRequestHandlers
  ),
};
