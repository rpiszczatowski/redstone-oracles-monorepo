import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-value-from-multicall-response";
import { extractValuesWithTheSameNameFromMulticall } from "../../../../shared/utils/extract-values-with-same-name-from-multicall-response";
import { gmdTokensContractsDetails } from "./gmdTokensContractsDetails";
import { getLastPrice } from "../../../../../../db/local-db";
import { MulticallParsedResponses } from "../../../../../../types";

export type GmdContractsDetailsKeys = keyof typeof gmdTokensContractsDetails;

const INDEXES_OF_GLP_TOKEN_ADDRESS_FROM_CONTRACT = [90, 130];
const INDEXES_OF_TOTAL_STAKED_FROM_CONTRACT = [194, 258];

export class GmdRequestHandler implements IEvmRequestHandlers {
  prepareMulticallRequest(id: GmdContractsDetailsKeys) {
    const { abi, address, vaultAbi, vaultAddress, poolInfoArg } =
      gmdTokensContractsDetails[id];

    const poolInfoRequest = buildMulticallRequests(vaultAbi, vaultAddress, [
      { name: "poolInfo", values: [poolInfoArg] },
    ]);

    const totalSupplyRequest = buildMulticallRequests(abi, address, [
      { name: "totalSupply" },
    ]);

    return [...poolInfoRequest, ...totalSupplyRequest];
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: GmdContractsDetailsKeys
  ): number | undefined {
    const { address, vaultAddress, tokenToFetch } =
      gmdTokensContractsDetails[id];

    const totalSupply = new Decimal(
      extractValueFromMulticallResponse(response, address, "totalSupply")
    );
    const poolsInfo = extractValuesWithTheSameNameFromMulticall(
      response,
      vaultAddress,
      "poolInfo"
    );

    const poolInfo = poolsInfo.find((poolInfo) => {
      const gmdTokenAddress = poolInfo?.slice(
        ...INDEXES_OF_GLP_TOKEN_ADDRESS_FROM_CONTRACT
      );
      return `0x${gmdTokenAddress}` === address.toLowerCase();
    });

    if (poolInfo) {
      const totalStaked = new Decimal(
        `0x${poolInfo.slice(...INDEXES_OF_TOTAL_STAKED_FROM_CONTRACT)}`
      );
      const ratio = totalStaked.div(totalSupply);
      const tokenToFetchPrice = getLastPrice(tokenToFetch);
      if (tokenToFetchPrice) {
        return ratio.mul(tokenToFetchPrice.value).toNumber();
      }
    }
  }
}
