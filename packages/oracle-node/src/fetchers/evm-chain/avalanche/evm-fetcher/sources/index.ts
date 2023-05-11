import { buildRequestHandlersFromContractDetails } from "../../../shared/utils/build-request-handlers-from-contract-details";
import { YieldYakTokensRequestHandlers } from "./yield-yak/YieldYakTokensRequestHandlers";
import { yieldYakTokensContractsDetails } from "./yield-yak";
import { DexLpTokensRequestHandler } from "./dex-lp-tokens/DexLpTokensRequestHandler";
import { dexLpTokensContractsDetails } from "./dex-lp-tokens";
import { MooTraderJoeTokensRequestHandlers } from "./moo-trader-joe/MooTraderJoeTokensRequestHandlers";
import { mooTraderJoeTokensContractsDetails } from "./moo-trader-joe";
import { OracleAdapterRequestHandlers } from "./oracle-adapter/OracleAdapterRequestHandlers";
import { oracleAdapterContractsDetails } from "./oracle-adapter";
import { GlpManagerRequestHandler } from "./glp-manager/GlpManagerRequestHandlers";
import { glpManagerContractsDetails } from "./glp-manager";

export const requestHandlers = {
  ...buildRequestHandlersFromContractDetails(
    yieldYakTokensContractsDetails,
    YieldYakTokensRequestHandlers
  ),
  ...buildRequestHandlersFromContractDetails(
    dexLpTokensContractsDetails,
    DexLpTokensRequestHandler
  ),
  ...buildRequestHandlersFromContractDetails(
    mooTraderJoeTokensContractsDetails,
    MooTraderJoeTokensRequestHandlers
  ),
  ...buildRequestHandlersFromContractDetails(
    oracleAdapterContractsDetails,
    OracleAdapterRequestHandlers
  ),
  ...buildRequestHandlersFromContractDetails(
    glpManagerContractsDetails,
    GlpManagerRequestHandler
  ),
};
