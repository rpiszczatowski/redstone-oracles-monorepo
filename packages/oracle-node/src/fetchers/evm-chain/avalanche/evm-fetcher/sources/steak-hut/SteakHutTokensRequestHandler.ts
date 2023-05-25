import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-prices";
import { steakHutTokensContractDetails } from "./steakHutTokensContractDetails";
import { MulticallParsedResponses } from "../../../../../../types";
import { TEN_AS_BASE_OF_POWER } from "../../../../shared/contants";
import { getTokensPricesFromLocalCache } from "../../../../shared/utils/get-tokens-prices-from-local-cache";

export type SteakHutTokensDetailsKeys =
  keyof typeof steakHutTokensContractDetails;

const TEN_TO_POWER_EIGHTEEN_AS_STRING = "1000000000000000000";
const FIRST_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE = [0, 66];
const SECOND_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE = [66, 130];

const STABLECOIN_DECIMALS = 6;
const BTC_DECIMALS = 8;
const AVAX_DECIMALS = 18;
const JOE_DECIMALS = 18;

export class SteakHutTokensRequestHandlers implements IEvmRequestHandlers {
  prepareMulticallRequest(id: SteakHutTokensDetailsKeys) {
    const { abi, address } = steakHutTokensContractDetails[id];
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
      let tokenReserveSerialized = tokenReserves[tokenName];
      let tokenDecimals = 1;
      if (["USDC", "USDT", "USDT.e"].includes(tokenName)) {
        tokenDecimals = STABLECOIN_DECIMALS;
      } else if (tokenName === "BTC") {
        tokenDecimals = BTC_DECIMALS;
      } else if (tokenName === "AVAX") {
        tokenDecimals = AVAX_DECIMALS;
      } else if (tokenName === "JOE") {
        tokenDecimals = JOE_DECIMALS;
      }
      const divider = new Decimal(TEN_AS_BASE_OF_POWER).toPower(tokenDecimals);
      tokenReserveSerialized = tokenReserves[tokenName].div(divider);
      serializedTokenReserves[tokenName] = tokenReserveSerialized;
    }
    return serializedTokenReserves;
  }
}
