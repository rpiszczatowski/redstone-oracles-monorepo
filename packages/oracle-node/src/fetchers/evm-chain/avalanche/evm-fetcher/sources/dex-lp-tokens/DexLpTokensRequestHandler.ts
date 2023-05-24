import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-prices";
import { dexLpTokensContractsDetails } from ".";
import { MulticallParsedResponses } from "../../../../../../types";
import { getFairPriceForLpToken } from "../../../../shared/utils/get-fair-price-lp-token";
import { serializeDecimalsForLpTokens } from "../../../../shared/utils/serialize-decimals-lp-tokens";

// Fair LP Token Pricing has been implemented with the help of: https://blog.alphaventuredao.io/fair-lp-token-pricing/

export type DexLpTokensDetailsKeys = keyof typeof dexLpTokensContractsDetails;

const FIRST_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE = [0, 66];
const SECOND_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE = [66, 130];

export class DexLpTokensRequestHandler implements IEvmRequestHandlers {
  prepareMulticallRequest(id: DexLpTokensDetailsKeys) {
    const { abi, address } = dexLpTokensContractsDetails[id];
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
    const { address, tokensToFetch } = dexLpTokensContractsDetails[id];
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
