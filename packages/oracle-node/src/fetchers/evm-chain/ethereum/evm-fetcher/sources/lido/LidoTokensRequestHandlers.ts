import Decimal from "decimal.js";
import { lidoTokensContractDetails } from "./lidoTokensContractDetails";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-value-from-multicall-response";
import { getRawPriceOrFail } from "../../../../../../db/local-db";
import { MulticallParsedResponses } from "../../../../../../types";

export type LidoDetailsKeys =
  keyof typeof lidoTokensContractDetails.contractsDetails;

export class LidoTokensRequestHandlers implements IEvmRequestHandlers {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  prepareMulticallRequest(id: LidoDetailsKeys) {
    const { abi } = lidoTokensContractDetails;
    const { address } = lidoTokensContractDetails.contractsDetails[id];
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

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  extractPrice(response: MulticallParsedResponses, id: LidoDetailsKeys) {
    const { address, underlyingToken } =
      lidoTokensContractDetails.contractsDetails[id];

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
    const stEthPerTokenParsed = stEthPerToken.div(decimalsAsDivider);
    if (!underlyingToken) {
      return stEthPerTokenParsed.toNumber();
    }
    const underlyingTokenPrice = getRawPriceOrFail(underlyingToken);
    return stEthPerTokenParsed.mul(underlyingTokenPrice.value).toNumber();
  }
}
