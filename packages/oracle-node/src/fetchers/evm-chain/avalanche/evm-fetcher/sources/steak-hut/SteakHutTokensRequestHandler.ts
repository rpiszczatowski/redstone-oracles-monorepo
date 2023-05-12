import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-prices";
import { steakHutTokensContractDetails } from "./steakHutTokensContractDetails";
import { MulticallParsedResponses } from "../../../../../../types";
import { getFairPriceForLpToken } from "../../../../shared/utils/get-fair-price-lp-token";
import { serializeDecimalsForLpTokens } from "../../../../shared/utils/serialize-decimals-lp-tokens";

export type SteakHutTokensDetailsKeys =
  keyof typeof steakHutTokensContractDetails;

const TEN_TO_POWER_EIGHTEEN_AS_STRING = "1000000000000000000";
const FIRST_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE = [0, 66];
const SECOND_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE = [66, 130];

export class SteakHutTokensRequestHandlers implements IEvmRequestHandlers {
  prepareMulticallRequest(id: SteakHutTokensDetailsKeys) {
    const { abi, address } = steakHutTokensContractDetails[id];
    const functionsNamesWithValues = [
      {
        name: "getUnderlyingAssets",
        values: [TEN_TO_POWER_EIGHTEEN_AS_STRING],
      },
    ];
    const underlyingAssetsRequest = buildMulticallRequests(
      abi,
      address,
      functionsNamesWithValues
    );

    const totalSupplyRequest = buildMulticallRequests(abi, address, [
      { name: "totalSupply" },
    ]);

    return [...underlyingAssetsRequest, ...totalSupplyRequest];
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: SteakHutTokensDetailsKeys
  ): number | undefined {
    const { address, tokensToFetch } = steakHutTokensContractDetails[id];
    const underlyingAssets = extractValueFromMulticallResponse(
      response,
      address,
      "getUnderlyingAssets"
    );
    const firstUnderlyingAsset = new Decimal(
      underlyingAssets.slice(...FIRST_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE)
    );
    const firstToken = tokensToFetch[0];
    const secondUnderlyingAsset = new Decimal(
      `0x${underlyingAssets.slice(
        ...SECOND_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE
      )}`
    );
    const secondToken = tokensToFetch[1];

    const tokenReserves = {
      [firstToken]: firstUnderlyingAsset,
      [secondToken]: secondUnderlyingAsset,
    };
    const serializedTokenReserves = serializeDecimalsForLpTokens(tokenReserves);

    const totalSupply = new Decimal(
      extractValueFromMulticallResponse(response, address, "totalSupply")
    );

    return getFairPriceForLpToken(serializedTokenReserves, totalSupply);
  }
}
