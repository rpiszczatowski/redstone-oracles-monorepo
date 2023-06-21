import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-value-from-multicall-response";
import { curveTokensContractsDetails } from "./curveTokensContractsDetails";
import { getTokensPricesFromLocalCache } from "../../../../shared/utils/get-tokens-prices-from-local-cache";
import {
  MulticallParsedResponses,
  MulticallRequest,
} from "../../../../../../types";

export type CurveTokensDetailsKeys = keyof typeof curveTokensContractsDetails;

export class CurveRequestHandlers implements IEvmRequestHandlers {
  prepareMulticallRequest(id: CurveTokensDetailsKeys) {
    const { abi, address } = curveTokensContractsDetails[id];
    const erc20BalanceRequests = this.prepareInternalRequestForCurveTokens(id);
    const functionsNamesWithValues = [{ name: "totalSupply" }];
    const totalSupplyRequest = buildMulticallRequests(
      abi,
      address,
      functionsNamesWithValues
    );
    return [...erc20BalanceRequests, ...totalSupplyRequest];
  }

  prepareInternalRequestForCurveTokens = (id: CurveTokensDetailsKeys) => {
    const { avWBTCAddress, avWETHAddress, av3CRVAddress } =
      curveTokensContractsDetails[id];

    return [avWBTCAddress, avWETHAddress, av3CRVAddress].reduce(
      (multicallRequests, contractAddress) => [
        ...multicallRequests,
        ...this.buildErc20BalanceOfRequest(id, contractAddress),
      ],
      [] as MulticallRequest[]
    );
  };

  buildErc20BalanceOfRequest(
    id: CurveTokensDetailsKeys,
    contractAddress: string
  ) {
    const { abi, contractWithBalancesAddress } =
      curveTokensContractsDetails[id];

    return buildMulticallRequests(abi, contractAddress, [
      { name: "balanceOf", values: [contractWithBalancesAddress] },
    ]);
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: CurveTokensDetailsKeys
  ): number | undefined {
    const { address } = curveTokensContractsDetails[id];
    const totalSupply = new Decimal(
      extractValueFromMulticallResponse(response, address, "totalSupply")
    );
    const { wbtcLiquidity, wethLiquidity, wcrvLiquidity } =
      this.calculateLiquiditiesForCurveToken(response, id);

    const totalLiquidity = wbtcLiquidity.add(wethLiquidity).add(wcrvLiquidity);
    return totalLiquidity.div(totalSupply).toNumber();
  }

  calculateLiquiditiesForCurveToken(
    multicallResult: MulticallParsedResponses,
    id: CurveTokensDetailsKeys
  ) {
    const { avWBTCAddress, avWETHAddress, av3CRVAddress, tokensToFetch } =
      curveTokensContractsDetails[id];
    const tokensToFetchPrice = getTokensPricesFromLocalCache(tokensToFetch);

    const wbtcLiquidity = this.calculateTokenLiquidity(
      multicallResult,
      avWBTCAddress,
      tokensToFetchPrice.BTC
    );
    const wethLiquidity = this.calculateTokenLiquidity(
      multicallResult,
      avWETHAddress,
      tokensToFetchPrice.ETH
    );
    const wcrvLiquidity = this.calculateTokenLiquidity(
      multicallResult,
      av3CRVAddress,
      tokensToFetchPrice.CRV
    );
    return { wbtcLiquidity, wethLiquidity, wcrvLiquidity };
  }

  calculateTokenLiquidity(
    multicallResult: MulticallParsedResponses,
    contractAddress: string,
    tokenToFetchPrice: Decimal
  ) {
    const balance = new Decimal(
      extractValueFromMulticallResponse(
        multicallResult,
        contractAddress,
        "balanceOf"
      )
    );
    return balance.mul(tokenToFetchPrice);
  }
}
