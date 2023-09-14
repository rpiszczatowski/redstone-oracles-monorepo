import { BeefyTokensRequestHandlers } from "../../../shared/request-handlers/BeefyTokensRequestHandlers";
import { DexLpTokensRequestHandlers } from "../../../shared/request-handlers/DexLpTokensRequestHandlers";
import { GlpManagerRequestHandler } from "../../../shared/request-handlers/GlpManagerRequestHandlers";
import { YieldYakTokensRequestHandlers } from "../../../shared/request-handlers/YieldYakTokensRequestHandlers";
import { buildRequestHandlersFromContractDetails } from "../../../shared/utils/build-request-handlers-from-contract-details";
import { beefyContractsDetails } from "./beefy/beefyContractsDetails";
import { dexLpTokensContractsDetails } from "./dex-lp-tokens/dexLpTokensContractsDetails";
import { glpManagerContractsDetails } from "./glp-manager/glpManagerContractsDetails";
import { LevelFinanceTokensRequestHandlers } from "./level-finance/LevelFinanceTokensRequestHandlers";
import { levelFinanceContractDetails } from "./level-finance/leveFinanceContractDetails";
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

  ...buildRequestHandlersFromContractDetails(
    dexLpTokensContractsDetails,
    DexLpTokensRequestHandlers
  ),

  ...buildRequestHandlersFromContractDetails(
    levelFinanceContractDetails,
    LevelFinanceTokensRequestHandlers
  ),
};
