import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-value-from-multicall-response";
import { extractValuesWithTheSameNameFromMulticall } from "../../../../shared/utils/extract-values-with-same-name-from-multicall-response";
import { gmdTokensContractsDetails } from "./gmdTokensContractsDetails";
import { getLastPrice } from "../../../../../../db/local-db";
import { MulticallParsedResponses } from "../../../../../../types";

export type GmdContractsDetailsKeys =
  keyof typeof gmdTokensContractsDetails.contractDetails;

const INDEXES_OF_GLP_TOKEN_ADDRESS_FROM_CONTRACT = [90, 130];
const INDEXES_OF_TOTAL_STAKED_FROM_CONTRACT = [194, 258];

export class GmdRequestHandler implements IEvmRequestHandlers {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  prepareMulticallRequest(id: GmdContractsDetailsKeys) {
    const { address, poolInfoArg } =
      gmdTokensContractsDetails.contractDetails[id];
    const { abi, vaultAbi, vaultAddress } = gmdTokensContractsDetails;

    const poolInfoRequest = buildMulticallRequests(vaultAbi, vaultAddress, [
      { name: "poolInfo", values: [poolInfoArg] },
    ]);

    const totalSupplyRequest = buildMulticallRequests(abi, address, [
      { name: "totalSupply" },
    ]);

    return [...poolInfoRequest, ...totalSupplyRequest];
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  extractPrice(
    response: MulticallParsedResponses,
    id: GmdContractsDetailsKeys
  ): number | undefined {
    const { address, tokenToFetch } =
      gmdTokensContractsDetails.contractDetails[id];
    const { vaultAddress } = gmdTokensContractsDetails;

    const totalSupply = new Decimal(
      extractValueFromMulticallResponse(response, address, "totalSupply")
    );
    const poolsInfo = extractValuesWithTheSameNameFromMulticall(
      response,
      vaultAddress,
      "poolInfo"
    );

    // Pool info returns struct which by multicall contract is returned as string which requires slicing
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
    return undefined;
  }
}
