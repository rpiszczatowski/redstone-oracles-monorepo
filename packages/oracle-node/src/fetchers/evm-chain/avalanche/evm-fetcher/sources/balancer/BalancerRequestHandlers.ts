import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-value-from-multicall-response";
import { balancerTokensContractDetails } from "./balancerTokensContractDetails";
import { MulticallParsedResponses } from "../../../../../../types";
import { getRawPriceOrFail } from "../../../../../../db/local-db";

export type BalancerTokensDetailsKeys =
  keyof typeof balancerTokensContractDetails;

export class BalancerRequestHandlers implements IEvmRequestHandlers {
  prepareMulticallRequest(id: BalancerTokensDetailsKeys) {
    const { mainPoolAbi, mainPoolAddress, secondPoolAbi, secondPoolAddress } =
      balancerTokensContractDetails[id];
    const firstPoolFunctions = [
      {
        name: "getRate",
      },
    ];
    const secondPoolFunctions = [
      {
        name: "getRate",
      },
    ];

    const firstPoolMulticallRequests = buildMulticallRequests(
      mainPoolAbi,
      mainPoolAddress,
      firstPoolFunctions
    );
    const secondPoolMulticallRequests = buildMulticallRequests(
      secondPoolAbi,
      secondPoolAddress,
      secondPoolFunctions
    );
    return [...firstPoolMulticallRequests, ...secondPoolMulticallRequests];
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: BalancerTokensDetailsKeys
  ): number | undefined {
    const { mainPoolAddress, secondPoolAddress, tokensToFetch, tokenDecimals } =
      balancerTokensContractDetails[id];

    const { mainPoolReserve, secondPoolReserve } = this.getReserves(
      response,
      mainPoolAddress,
      secondPoolAddress
    );

    const firstTokenPrice = getRawPriceOrFail(tokensToFetch[0]);
    const secondTokenPrice = getRawPriceOrFail(tokensToFetch[1]);

    const secondPoolPrice = secondPoolReserve
      .mul(secondTokenPrice.value)
      .div(10 ** tokenDecimals);

    const underlyingTokenPrice = Decimal.min(
      firstTokenPrice.value,
      secondPoolPrice
    );

    return mainPoolReserve
      .mul(underlyingTokenPrice)
      .div(10 ** tokenDecimals)
      .toNumber();
  }

  private getReserves(
    response: MulticallParsedResponses,
    mainPoolAddress: string,
    secondPoolAddress: string
  ) {
    const mainPoolReserve = extractValueFromMulticallResponse(
      response,
      mainPoolAddress,
      "getRate"
    );
    const secondPoolReserve = extractValueFromMulticallResponse(
      response,
      secondPoolAddress,
      "getRate"
    );

    return {
      mainPoolReserve: new Decimal(mainPoolReserve),
      secondPoolReserve: new Decimal(secondPoolReserve),
    };
  }
}
