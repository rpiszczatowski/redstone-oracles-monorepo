import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-value-from-multicall-response";
import { steakHutTokensContractDetails } from "./steakHutTokensContractDetails";
import { getTokensPricesFromLocalCache } from "../../../../shared/utils/get-tokens-prices-from-local-cache";
import { getContractDetailsFromConfig } from "../../../../shared/utils/get-contract-details-from-config";
import { TEN_AS_BASE_OF_POWER } from "../../../../shared/contants";
import { MulticallParsedResponses } from "../../../../../../types";

export type SteakHutTokensDetailsKeys =
  keyof typeof steakHutTokensContractDetails;
export type SteakHutTokensDetailsValues =
  (typeof steakHutTokensContractDetails)[SteakHutTokensDetailsKeys];

const TEN_TO_POWER_EIGHTEEN_AS_STRING = "1000000000000000000";
const FIRST_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE = [0, 66];
const SECOND_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE = [66, 130];

const DEFAULT_DECIMALS = 1;
const STABLECOIN_DECIMALS = 6;
const BTC_DECIMALS = 8;
const AVAX_DECIMALS = 18;
const JOE_DECIMALS = 18;
const TOKENS_DECIMALS: Record<string, number> = {
  USDC: STABLECOIN_DECIMALS,
  USDT: STABLECOIN_DECIMALS,
  "USDT.e": STABLECOIN_DECIMALS,
  EUROC: STABLECOIN_DECIMALS,
  BTC: BTC_DECIMALS,
  AVAX: AVAX_DECIMALS,
  JOE: JOE_DECIMALS,
};

export class SteakHutTokensRequestHandlers implements IEvmRequestHandlers {
  prepareMulticallRequest(id: SteakHutTokensDetailsKeys) {
    const { abi, address } = getContractDetailsFromConfig<
      SteakHutTokensDetailsKeys,
      SteakHutTokensDetailsValues
    >(steakHutTokensContractDetails, id);

    const functionsNamesWithValues = [
      {
        name: "getUnderlyingAssets",
        values: [TEN_TO_POWER_EIGHTEEN_AS_STRING],
      },
    ];
    return buildMulticallRequests(abi, address, functionsNamesWithValues);
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: SteakHutTokensDetailsKeys
  ): number | undefined {
    const { address, tokensToFetch } = getContractDetailsFromConfig<
      SteakHutTokensDetailsKeys,
      SteakHutTokensDetailsValues
    >(steakHutTokensContractDetails, id);

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

    const underlyingTokens = {
      [firstToken]: firstUnderlyingAsset,
      [secondToken]: secondUnderlyingAsset,
    };
    const serializedUnderlyingTokens = this.serializeDecimals(underlyingTokens);

    const [firstUnderlyingAssetValue, secondUnderlyingAssetValue] =
      Object.values(serializedUnderlyingTokens);
    const tokensReservesPrices = getTokensPricesFromLocalCache(tokensToFetch);
    const firstTokenPrice = firstUnderlyingAssetValue.mul(
      tokensReservesPrices[firstToken]
    );
    const secondTokenPrice = secondUnderlyingAssetValue.mul(
      tokensReservesPrices[secondToken]
    );

    return firstTokenPrice.add(secondTokenPrice).toNumber();
  }

  // We divide each underlying asset value by decimals of the token
  serializeDecimals(tokenReserves: Record<string, Decimal>) {
    const serializedTokenReserves = {} as Record<string, Decimal>;
    for (const tokenName of Object.keys(tokenReserves)) {
      const tokenDecimals = TOKENS_DECIMALS[tokenName] ?? DEFAULT_DECIMALS;
      const divider = new Decimal(TEN_AS_BASE_OF_POWER).toPower(tokenDecimals);
      const tokenReserveSerialized = tokenReserves[tokenName].div(divider);
      serializedTokenReserves[tokenName] = tokenReserveSerialized;
    }
    return serializedTokenReserves;
  }
}
