import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../IEvmRequestHandlers";
import { buildMulticallRequests } from "../utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../utils/extract-value-from-multicall-response";
import { getContractDetailsFromConfig } from "../utils/get-contract-details-from-config";
import { getLastPrice } from "../../../../db/local-db";
import { MulticallParsedResponses } from "../../../../types";
import YieldYakLpTokenAbi from "../../shared/abis/YieldYakLPToken.abi.json";

const TOTAL_DEPOSITS_FUNCTION_NAME = "totalDeposits";
const TOTAL_SUPPLY_FUNCTION_NAME = "totalSupply";

type YieldYakContractDetails = {
  address: string;
  tokenToFetch: string;
};

export class YieldYakTokensRequestHandlers implements IEvmRequestHandlers {
  constructor(
    private readonly yieldYakContractDetails: Record<
      string,
      YieldYakContractDetails
    >
  ) {}

  prepareMulticallRequest(id: string) {
    const { address } = getContractDetailsFromConfig<
      string,
      YieldYakContractDetails
    >(this.yieldYakContractDetails, id);

    const functionsNamesWithValues = [
      { name: TOTAL_DEPOSITS_FUNCTION_NAME },
      { name: TOTAL_SUPPLY_FUNCTION_NAME },
    ];
    return buildMulticallRequests(
      YieldYakLpTokenAbi,
      address,
      functionsNamesWithValues
    );
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: string
  ): number | undefined {
    const { address, tokenToFetch } = getContractDetailsFromConfig<
      string,
      YieldYakContractDetails
    >(this.yieldYakContractDetails, id);

    const totalDeposits = new Decimal(
      extractValueFromMulticallResponse(
        response,
        address,
        TOTAL_DEPOSITS_FUNCTION_NAME
      )
    );
    const totalSupply = new Decimal(
      extractValueFromMulticallResponse(
        response,
        address,
        TOTAL_SUPPLY_FUNCTION_NAME
      )
    );

    const tokenValue = totalDeposits.div(totalSupply);
    const tokenToFetchPrice = getLastPrice(tokenToFetch);
    if (tokenToFetchPrice) {
      return tokenValue.mul(tokenToFetchPrice.value).toNumber();
    }
    return undefined;
  }
}
