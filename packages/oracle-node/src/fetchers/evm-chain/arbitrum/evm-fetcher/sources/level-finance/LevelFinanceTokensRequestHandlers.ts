import Decimal from "decimal.js";
import { levelFinanceContractDetails } from "./leveFinanceContractDetails";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-value-from-multicall-response";
import { MulticallParsedResponses } from "../../../../../../types";
import LevelFinanceLpTokenAbi from "./LevelFinanceLpToken.abi.json";
import LevelFinanceLiquidityCalculatorAbi from "./LevelFinanceLiquidityCalculator.abi.json";

export const LIQUIDITY_CALCULATOR_ADDRESS =
  "0xf1e5D6c0ce39fDBb9682F1A3385f0d2067740C61";

const TOTAL_SUPPLY_FUNCTION_NAME = "totalSupply";
const GET_TRANCHE_VALUE_FUNCTION_NAME = "getTrancheValue";

type LevelFinanceContractDetailsKeys = keyof typeof levelFinanceContractDetails;

export class LevelFinanceTokensRequestHandlers implements IEvmRequestHandlers {
  prepareMulticallRequest(id: LevelFinanceContractDetailsKeys) {
    const { address } = levelFinanceContractDetails[id];
    const totalSupplyRequest = buildMulticallRequests(
      LevelFinanceLpTokenAbi,
      address,
      [{ name: TOTAL_SUPPLY_FUNCTION_NAME }]
    );
    const trancheValueFunctionNameWithValues = {
      name: GET_TRANCHE_VALUE_FUNCTION_NAME,
      values: [address, false],
    };
    const trancheValueRequest = buildMulticallRequests(
      LevelFinanceLiquidityCalculatorAbi,
      LIQUIDITY_CALCULATOR_ADDRESS,
      [trancheValueFunctionNameWithValues]
    );
    return [...totalSupplyRequest, ...trancheValueRequest];
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: LevelFinanceContractDetailsKeys
  ) {
    const { address } = levelFinanceContractDetails[id];
    const totalSupplyAsHex = extractValueFromMulticallResponse(
      response,
      address,
      TOTAL_SUPPLY_FUNCTION_NAME
    );
    const totalSupply = new Decimal(totalSupplyAsHex);
    const trancheValueAsHex = extractValueFromMulticallResponse(
      response,
      LIQUIDITY_CALCULATOR_ADDRESS,
      GET_TRANCHE_VALUE_FUNCTION_NAME
    );
    const trancheValue = new Decimal(trancheValueAsHex);
    return trancheValue.div(totalSupply).toNumber();
  }
}
