import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../IEvmRequestHandlers";
import { buildMulticallRequests } from "../utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../utils/extract-value-from-multicall-response";
import { getFairPriceForLpToken } from "../utils/get-fair-price-lp-token";
import { serializeDecimalsForLpTokens } from "../utils/serialize-decimals-lp-tokens";
import { getContractDetailsFromConfig } from "../utils/get-contract-details-from-config";
import { MulticallParsedResponses } from "../../../../types";
import DexLpTokenAbi from "../abis/DexLpToken.abi.json";

// Fair LP Token Pricing has been implemented with the help of: https://blog.alphaventuredao.io/fair-lp-token-pricing/

interface DexLpTokensContractDetails {
  address: string;
  tokensToFetch: string[];
}

const GET_RESERVES_FUNCTION_NAME = "getReserves";
const TOTAL_SUPPLY_FUNCTION_NAME = "totalSupply";

export class DexLpTokensRequestHandlers implements IEvmRequestHandlers {
  constructor(
    private readonly dexLpTokensContractsDetails: Record<
      string,
      DexLpTokensContractDetails
    >
  ) {}

  prepareMulticallRequest(id: string) {
    const { address } = getContractDetailsFromConfig<
      string,
      DexLpTokensContractDetails
    >(this.dexLpTokensContractsDetails, id);

    const functionsNamesWithValues = [
      { name: GET_RESERVES_FUNCTION_NAME },
      { name: TOTAL_SUPPLY_FUNCTION_NAME },
    ];
    return buildMulticallRequests(
      DexLpTokenAbi,
      address,
      functionsNamesWithValues
    );
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: string
  ): number | undefined {
    const { address, tokensToFetch } = getContractDetailsFromConfig<
      string,
      DexLpTokensContractDetails
    >(this.dexLpTokensContractsDetails, id);

    const { firstReserve, secondReserve } = this.extractReserves(response, id);
    const firstToken = tokensToFetch[0];
    const secondToken = tokensToFetch[1];
    const tokenReserves = {
      [firstToken]: firstReserve,
      [secondToken]: secondReserve,
    };

    const reservesSerialized = serializeDecimalsForLpTokens(tokenReserves);

    const totalSupply = new Decimal(
      extractValueFromMulticallResponse(response, address, "totalSupply")
    );

    return getFairPriceForLpToken(reservesSerialized, totalSupply);
  }

  extractReserves(response: MulticallParsedResponses, id: string) {
    const { address } = getContractDetailsFromConfig<
      string,
      DexLpTokensContractDetails
    >(this.dexLpTokensContractsDetails, id);
    const reservesResult = extractValueFromMulticallResponse(
      response,
      address,
      GET_RESERVES_FUNCTION_NAME
    );
    const contractInterface = new Interface(DexLpTokenAbi);
    const reservesDecoded = contractInterface.decodeFunctionResult(
      GET_RESERVES_FUNCTION_NAME,
      reservesResult
    );
    const firstReserveAsHex = (
      reservesDecoded._reserve0 as BigNumber
    ).toHexString();
    const secondReserveAsHex = (
      reservesDecoded._reserve1 as BigNumber
    ).toHexString();
    const firstReserve = new Decimal(firstReserveAsHex);
    const secondReserve = new Decimal(secondReserveAsHex);
    return { firstReserve, secondReserve };
  }
}
