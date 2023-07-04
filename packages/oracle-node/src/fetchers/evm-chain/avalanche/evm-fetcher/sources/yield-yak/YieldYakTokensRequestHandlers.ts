import { Decimal } from "decimal.js";
import { yieldYakTokensContractsDetails } from "./yieldYakTokensContractsDetails";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-value-from-multicall-response";
import { getContractDetailsFromConfig } from "../../../../shared/utils/get-contract-details-from-config";
import { getLastPrice } from "../../../../../../db/local-db";
import { MulticallParsedResponses } from "../../../../../../types";

export type YieldYakTokensDetailsKeys =
  keyof typeof yieldYakTokensContractsDetails;
type YieldYakTokensDetailsValues =
  (typeof yieldYakTokensContractsDetails)[YieldYakTokensDetailsKeys];

export class YieldYakTokensRequestHandlers implements IEvmRequestHandlers {
  prepareMulticallRequest(id: YieldYakTokensDetailsKeys) {
    const { abi, address } = getContractDetailsFromConfig<
      YieldYakTokensDetailsKeys,
      YieldYakTokensDetailsValues
    >(yieldYakTokensContractsDetails, id);

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
    const { address, tokenToFetch } = getContractDetailsFromConfig<
      YieldYakTokensDetailsKeys,
      YieldYakTokensDetailsValues
    >(yieldYakTokensContractsDetails, id);

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
