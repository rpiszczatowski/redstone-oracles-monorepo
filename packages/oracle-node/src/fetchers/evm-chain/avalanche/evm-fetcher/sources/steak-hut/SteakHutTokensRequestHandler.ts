import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
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

const GET_UNDERLYING_ASSETS_FUNCTION_NAME = "getUnderlyingAssets";

const DEFAULT_DECIMALS = 1;
const STABLECOIN_DECIMALS = 6;
const BTC_DECIMALS = 8;
const AVAX_DECIMALS = 18;
const JOE_DECIMALS = 18;
const GMX_DECIMALS = 18;
const TOKENS_DECIMALS: Record<string, number | undefined> = {
  USDC: STABLECOIN_DECIMALS,
  USDT: STABLECOIN_DECIMALS,
  "USDT.e": STABLECOIN_DECIMALS,
  EUROC: STABLECOIN_DECIMALS,
  BTC: BTC_DECIMALS,
  AVAX: AVAX_DECIMALS,
  JOE: JOE_DECIMALS,
  GMX: GMX_DECIMALS,
};

export class SteakHutTokensRequestHandlers implements IEvmRequestHandlers {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  prepareMulticallRequest(id: SteakHutTokensDetailsKeys) {
    const { abi, address } = getContractDetailsFromConfig<
      SteakHutTokensDetailsKeys,
      SteakHutTokensDetailsValues
    >(steakHutTokensContractDetails, id);

    const functionsNamesWithValues = [
      {
        name: GET_UNDERLYING_ASSETS_FUNCTION_NAME,
        values: [TEN_TO_POWER_EIGHTEEN_AS_STRING],
      },
    ];
    return buildMulticallRequests(abi, address, functionsNamesWithValues);
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  extractPrice(
    response: MulticallParsedResponses,
    id: SteakHutTokensDetailsKeys
  ): number | undefined {
    const { tokensToFetch } = getContractDetailsFromConfig<
      SteakHutTokensDetailsKeys,
      SteakHutTokensDetailsValues
    >(steakHutTokensContractDetails, id);

    const { firstAssetValue, secondAssetValue } =
      SteakHutTokensRequestHandlers.extractUnderlyingAssets(response, id);

    const firstToken = tokensToFetch[0];
    const secondToken = tokensToFetch[1];

    const underlyingTokens = {
      [firstToken]: firstAssetValue,
      [secondToken]: secondAssetValue,
    };
    const serializedUnderlyingTokens =
      SteakHutTokensRequestHandlers.serializeDecimals(underlyingTokens);

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
  static serializeDecimals(tokenReserves: Record<string, Decimal>) {
    const serializedTokenReserves = {} as Record<string, Decimal>;
    for (const tokenName of Object.keys(tokenReserves)) {
      const tokenDecimals = TOKENS_DECIMALS[tokenName] ?? DEFAULT_DECIMALS;
      const divider = new Decimal(TEN_AS_BASE_OF_POWER).toPower(tokenDecimals);
      const tokenReserveSerialized = tokenReserves[tokenName].div(divider);
      serializedTokenReserves[tokenName] = tokenReserveSerialized;
    }
    return serializedTokenReserves;
  }

  static extractUnderlyingAssets(
    response: MulticallParsedResponses,
    id: SteakHutTokensDetailsKeys
  ) {
    const { abi, address } = getContractDetailsFromConfig<
      SteakHutTokensDetailsKeys,
      SteakHutTokensDetailsValues
    >(steakHutTokensContractDetails, id);

    const underlyingAssetsResult = extractValueFromMulticallResponse(
      response,
      address,
      GET_UNDERLYING_ASSETS_FUNCTION_NAME
    );

    const contractInterface = new Interface(abi);
    const underlyingAssets = contractInterface.decodeFunctionResult(
      GET_UNDERLYING_ASSETS_FUNCTION_NAME,
      underlyingAssetsResult
    );
    const firstAssetValueAsHex = (
      underlyingAssets.totalX as BigNumber
    ).toHexString();
    const firstAssetValue = new Decimal(firstAssetValueAsHex);
    const secondAssetValueAsHex = (
      underlyingAssets.totalY as BigNumber
    ).toHexString();
    const secondAssetValue = new Decimal(secondAssetValueAsHex);
    return { firstAssetValue, secondAssetValue };
  }
}
