import { Decimal } from "decimal.js";
import { dexLpTokensContractsDetails } from "./dexLpTokensContractsDetails";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-value-from-multicall-response";
import { getFairPriceForLpToken } from "../../../../shared/utils/get-fair-price-lp-token";
import { serializeDecimalsForLpTokens } from "../../../../shared/utils/serialize-decimals-lp-tokens";
import { getContractDetailsFromConfig } from "../../../../shared/utils/get-contract-details-from-config";
import { MulticallParsedResponses } from "../../../../../../types";

// Fair LP Token Pricing has been implemented with the help of: https://blog.alphaventuredao.io/fair-lp-token-pricing/

export type DexLpTokensDetailsKeys = keyof typeof dexLpTokensContractsDetails;
export type DexLpTokensDetailsValues =
  (typeof dexLpTokensContractsDetails)[DexLpTokensDetailsKeys];

const FIRST_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE = [0, 66];
const SECOND_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE = [66, 130];

export class DexLpTokensRequestHandlers implements IEvmRequestHandlers {
  prepareMulticallRequest(id: DexLpTokensDetailsKeys) {
    const { abi, address } = getContractDetailsFromConfig<
      DexLpTokensDetailsKeys,
      DexLpTokensDetailsValues
    >(dexLpTokensContractsDetails, id);

    const functionsNamesWithValues = [
      { name: "getReserves" },
      { name: "totalSupply" },
    ];
    return buildMulticallRequests(abi, address, functionsNamesWithValues);
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: DexLpTokensDetailsKeys
  ): number | undefined {
    const { address, tokensToFetch } = getContractDetailsFromConfig<
      DexLpTokensDetailsKeys,
      DexLpTokensDetailsValues
    >(dexLpTokensContractsDetails, id);

    const reserves = extractValueFromMulticallResponse(
      response,
      address,
      "getReserves"
    );

    const firstTokenReserve = new Decimal(
      reserves.slice(...FIRST_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE)
    );
    const firstToken = tokensToFetch[0];
    const secondTokenReserve = new Decimal(
      `0x${reserves.slice(...SECOND_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE)}`
    );
    const secondToken = tokensToFetch[1];
    const tokenReserves = {
      [firstToken]: firstTokenReserve,
      [secondToken]: secondTokenReserve,
    };

    const reservesSerialized = serializeDecimalsForLpTokens(tokenReserves);

    const totalSupply = new Decimal(
      extractValueFromMulticallResponse(response, address, "totalSupply")
    );

    return getFairPriceForLpToken(reservesSerialized, totalSupply);
  }
}
