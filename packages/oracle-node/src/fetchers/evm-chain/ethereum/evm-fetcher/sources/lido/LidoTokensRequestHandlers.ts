import Decimal from "decimal.js";
import { lidoTokensContractDetails } from "./lidoTokensContractDetails";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-value-from-multicall-response";
import { getRawPriceOrFail } from "../../../../../../db/local-db";
import { MulticallParsedResponses } from "../../../../../../types";

export type LidoDetailsKeys = keyof typeof lidoTokensContractDetails;

export class LidoTokensRequestHandlers implements IEvmRequestHandlers {
  prepareMulticallRequest(id: LidoDetailsKeys) {
    const { address, abi } = lidoTokensContractDetails[id];
    const stEthPerTokenFunction = {
      name: "stEthPerToken",
    };
    const decimalsFunction = {
      name: "decimals",
    };
    return buildMulticallRequests(abi, address, [
      stEthPerTokenFunction,
      decimalsFunction,
    ]);
  }

  extractPrice(response: MulticallParsedResponses, id: LidoDetailsKeys) {
    const { address, underlyingToken } = lidoTokensContractDetails[id];
    const stEthPerTokenAsHex = extractValueFromMulticallResponse(
      response,
      address,
      "stEthPerToken"
    );
    const stEthPerToken = new Decimal(stEthPerTokenAsHex);
    const decimalsAsHex = extractValueFromMulticallResponse(
      response,
      address,
      "decimals"
    );
    const decimals = new Decimal(decimalsAsHex);
    const decimalsAsDivider = 10 ** decimals.toNumber();
    const underlyingTokenPrice = getRawPriceOrFail(underlyingToken);
    return stEthPerToken
      .div(decimalsAsDivider)
      .mul(underlyingTokenPrice.value)
      .toNumber();
  }
}
