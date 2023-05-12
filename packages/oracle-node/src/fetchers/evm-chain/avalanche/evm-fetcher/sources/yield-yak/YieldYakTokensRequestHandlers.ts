import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-prices";
import { getLastPrice } from "../../../../../../db/local-db";
import { yieldYakTokensContractsDetails } from ".";
import { MulticallParsedResponses } from "../../../../../../types";

export type YieldYakTokensDetailsKeys =
  keyof typeof yieldYakTokensContractsDetails;

export class YieldYakTokensRequestHandlers implements IEvmRequestHandlers {
  prepareMulticallRequest(id: YieldYakTokensDetailsKeys) {
    const { abi, address } = yieldYakTokensContractsDetails[id];
    const functionsNamesWithValues = [
      { name: "totalDeposits" },
      { name: "totalSupply" },
    ];
    return buildMulticallRequests(abi, address, functionsNamesWithValues);
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: YieldYakTokensDetailsKeys
  ): number | undefined {
    const { address, tokenToFetch } = yieldYakTokensContractsDetails[id];
    const totalDeposits = new Decimal(
      extractValueFromMulticallResponse(response, address, "totalDeposits")
    );
    const totalSupply = new Decimal(
      extractValueFromMulticallResponse(response, address, "totalSupply")
    );

    const tokenValue = totalDeposits.div(totalSupply);
    const tokenToFetchPrice = getLastPrice(tokenToFetch);
    if (tokenToFetchPrice) {
      return tokenValue.mul(tokenToFetchPrice.value).toNumber();
    }
  }
}
