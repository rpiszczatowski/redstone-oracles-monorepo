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

const FIRST_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE = [0, 66];
const SECOND_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE = [66, 130];

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
      { name: "getReserves" },
      { name: "totalSupply" },
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
