import { Interface } from "ethers/lib/utils";
import Decimal from "decimal.js";
import { levelFinanceContractDetails } from "./leveFinanceContractDetails";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-value-from-multicall-response";
import {
  MulticallParsedResponse,
  MulticallParsedResponses,
} from "../../../../../../types";
import LevelFinanceLpTokenAbi from "./LevelFinanceLpToken.abi.json";
import LevelFinanceLiquidityCalculatorAbi from "./LevelFinanceLiquidityCalculator.abi.json";
import { extractValuesWithTheSameNameFromMulticall } from "../../../../shared/utils/extract-values-with-same-name-from-multicall-response";

export const LIQUIDITY_CALCULATOR_ADDRESS =
  "0xf1e5D6c0ce39fDBb9682F1A3385f0d2067740C61";

const TOTAL_SUPPLY_FUNCTION_NAME = "totalSupply";
const GET_TRANCHE_VALUE_FUNCTION_NAME = "getTrancheValue";

const LLP_TOKEN_MULTIPLIER = 1e12;

type LevelFinanceContractDetailsKeys = keyof typeof levelFinanceContractDetails;

export class LevelFinanceTokensRequestHandlers implements IEvmRequestHandlers {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
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

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  extractPrice(
    response: MulticallParsedResponses,
    id: LevelFinanceContractDetailsKeys
  ): number | undefined {
    const { address } = levelFinanceContractDetails[id];
    const totalSupplyAsHex = extractValueFromMulticallResponse(
      response,
      address,
      TOTAL_SUPPLY_FUNCTION_NAME
    );
    const totalSupply = new Decimal(totalSupplyAsHex);
    const trancheValuesResponses = extractValuesWithTheSameNameFromMulticall(
      response,
      LIQUIDITY_CALCULATOR_ADDRESS,
      GET_TRANCHE_VALUE_FUNCTION_NAME
    );
    const trancheValueResponse =
      LevelFinanceTokensRequestHandlers.extractTrancheResponseForAddress(
        trancheValuesResponses,
        address
      );

    if (trancheValueResponse) {
      const trancheValue = new Decimal(trancheValueResponse.value);
      return trancheValue.div(totalSupply).div(LLP_TOKEN_MULTIPLIER).toNumber();
    }
    return undefined;
  }

  static extractTrancheResponseForAddress(
    trancheValuesResponses: MulticallParsedResponse[],
    address: string
  ) {
    const contractInterface = new Interface(LevelFinanceLiquidityCalculatorAbi);
    return trancheValuesResponses.find((trancheValueResponse) => {
      if (trancheValueResponse.data) {
        const functionData = contractInterface.decodeFunctionData(
          GET_TRANCHE_VALUE_FUNCTION_NAME,
          trancheValueResponse.data
        );
        const addressFromFunctionData = functionData._tranche as string;
        return addressFromFunctionData.toLowerCase() === address.toLowerCase();
      }
      return false;
    });
  }
}
