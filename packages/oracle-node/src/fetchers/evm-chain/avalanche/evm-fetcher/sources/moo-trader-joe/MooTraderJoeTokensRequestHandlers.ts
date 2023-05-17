import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-prices";
import { mooTraderJoeTokensContractsDetails } from ".";
import { getLastPrice } from "../../../../../../db/local-db";
import { MulticallParsedResponses } from "../../../../../../types";

export type MooTraderJoeTokensDetailsKeys =
  keyof typeof mooTraderJoeTokensContractsDetails;

export class MooTraderJoeTokensRequestHandlers implements IEvmRequestHandlers {
  prepareMulticallRequest(id: MooTraderJoeTokensDetailsKeys) {
    const { abi, address } = mooTraderJoeTokensContractsDetails[id];
    const functionsNamesWithValues = [
      { name: "balance" },
      { name: "totalSupply" },
    ];
    return buildMulticallRequests(abi, address, functionsNamesWithValues);
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: MooTraderJoeTokensDetailsKeys
  ): number | undefined {
    const { address, tokenToFetch } = mooTraderJoeTokensContractsDetails[id];
    const balance = new Decimal(
      extractValueFromMulticallResponse(response, address, "balance")
    );
    const totalSupply = new Decimal(
      extractValueFromMulticallResponse(response, address, "totalSupply")
    );

    const tokenValue = balance.div(totalSupply);
    const tokenToFetchPrice = getLastPrice(tokenToFetch);
    if (tokenToFetchPrice) {
      return tokenValue.mul(tokenToFetchPrice.value).toNumber();
    }
  }
}
