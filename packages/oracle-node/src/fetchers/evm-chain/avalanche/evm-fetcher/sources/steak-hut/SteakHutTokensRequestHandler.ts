import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-prices";
import { getLastPrice } from "../../../../../../db/local-db";
import { steakHutTokensContractDetails } from "./steakHutTokensContractDetails";
import { MulticallParsedResponses } from "../../../../../../types";

export type SteakHutTokensDetailsKeys =
  keyof typeof steakHutTokensContractDetails;

const TEN_TO_POWER_EIGHTEEN_AS_STRING = "1000000000000000000";

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
    const firstAsset = new Decimal(underlyingAssets.slice(0, 66));
    const secondAsset = new Decimal(`0x${underlyingAssets.slice(66, 130)}`);
    const tokensPrices = this.fetchTokensFromLocalCache(tokensToFetch);

    const firstAssetPrice = firstAsset.mul(tokensPrices[0]);
    const secondAssetPrice = secondAsset.mul(tokensPrices[1]);
    return firstAssetPrice.add(secondAssetPrice).toNumber();
  }

  fetchTokensFromLocalCache(tokensToFetch: string[]) {
    const tokensPrices = [];
    for (const tokenToFetch of tokensToFetch) {
      const tokenPrice = getLastPrice(tokenToFetch);
      if (!tokenPrice) {
        throw new Error(
          `Cannot get last price from cache for: ${tokenToFetch}`
        );
      }
      tokensPrices.push(new Decimal(tokenPrice.value));
    }
    return tokensPrices;
  }
}
