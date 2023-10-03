import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-value-from-multicall-response";
import { extractValuesWithTheSameNameFromMulticall } from "../../../../shared/utils/extract-values-with-same-name-from-multicall-response";
import { gmdTokensContractsDetails } from "./gmdTokensContractsDetails";
import { getLastPrice } from "../../../../../../db/local-db";
import {
  MulticallParsedResponse,
  MulticallParsedResponses,
} from "../../../../../../types";

export type GmdContractsDetailsKeys =
  keyof typeof gmdTokensContractsDetails.contractDetails;

const POOL_INFO_FUNCTION_NAME = "poolInfo";
const TOTAL_SUPPLY_FUNCTION_NAME = "totalSupply";

export class GmdRequestHandler implements IEvmRequestHandlers {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  prepareMulticallRequest(id: GmdContractsDetailsKeys) {
    const { address, poolInfoArg } =
      gmdTokensContractsDetails.contractDetails[id];
    const { abi, vaultAbi, vaultAddress } = gmdTokensContractsDetails;

    const poolInfoRequest = buildMulticallRequests(vaultAbi, vaultAddress, [
      { name: POOL_INFO_FUNCTION_NAME, values: [poolInfoArg] },
    ]);

    const totalSupplyRequest = buildMulticallRequests(abi, address, [
      { name: TOTAL_SUPPLY_FUNCTION_NAME },
    ]);

    return [...poolInfoRequest, ...totalSupplyRequest];
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  extractPrice(
    responses: MulticallParsedResponses,
    id: GmdContractsDetailsKeys
  ): number | undefined {
    const { address, tokenToFetch } =
      gmdTokensContractsDetails.contractDetails[id];
    const { vaultAddress } = gmdTokensContractsDetails;

    const totalSupply = new Decimal(
      extractValueFromMulticallResponse(
        responses,
        address,
        TOTAL_SUPPLY_FUNCTION_NAME
      )
    );
    const poolsInfo = extractValuesWithTheSameNameFromMulticall(
      responses,
      vaultAddress,
      POOL_INFO_FUNCTION_NAME
    );

    const poolsInfoDecoded = GmdRequestHandler.decodePoolInfoResults(poolsInfo);
    const poolInfo = poolsInfoDecoded.find((poolInfo) => {
      const addressFromResult = (poolInfo.GDlptoken as string).toLowerCase();
      return addressFromResult === address.toLowerCase();
    });

    if (poolInfo) {
      const totalStakedAsHex = (
        poolInfo.totalStaked as BigNumber
      ).toHexString();
      const totalStaked = new Decimal(totalStakedAsHex);
      const ratio = totalStaked.div(totalSupply);
      const tokenToFetchPrice = getLastPrice(tokenToFetch);
      if (tokenToFetchPrice) {
        return ratio.mul(tokenToFetchPrice.value).toNumber();
      }
    }
    return undefined;
  }

  static decodePoolInfoResults(poolsInfo: MulticallParsedResponse[]) {
    const { vaultAbi } = gmdTokensContractsDetails;
    const contractInterface = new Interface(vaultAbi);
    return poolsInfo.map((poolInfo) =>
      contractInterface.decodeFunctionResult(
        POOL_INFO_FUNCTION_NAME,
        poolInfo.value
      )
    );
  }
}
