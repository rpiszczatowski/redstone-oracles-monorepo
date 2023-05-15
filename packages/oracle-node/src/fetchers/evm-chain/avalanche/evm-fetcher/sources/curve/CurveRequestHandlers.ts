import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-value-from-multicall-response";
import { curveTokensContractsDetails } from "./curveTokensContractsDetails";
import { MulticallParsedResponses } from "../../../../../../types";
import { getTokensPricesFromLocalCache } from "../../../../shared/utils/get-tokens-prices-from-local-cache";

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

    const wbtcBalanceRequest = this.buildErc20BalanceOfRequest(
      id,
      avWBTCAddress
    );
    const wethBalanceRequest = this.buildErc20BalanceOfRequest(
      id,
      avWETHAddress
    );
    const crvBalanceRequest = this.buildErc20BalanceOfRequest(
      id,
      av3CRVAddress
    );
    return [...wbtcBalanceRequest, ...wethBalanceRequest, ...crvBalanceRequest];
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

    if (wbtcLiquidity && wethLiquidity && wcrvLiquidity) {
      const totalLiquidity = wbtcLiquidity
        .add(wethLiquidity)
        .add(wcrvLiquidity);
      return totalLiquidity.div(totalSupply).toNumber();
    }
  }

  calculateLiquiditiesForCurveToken(
    multicallResult: MulticallParsedResponses,
    id: CurveTokensDetailsKeys
  ) {
    const { avWBTCAddress, avWETHAddress, av3CRVAddress, tokensToFetch } =
      curveTokensContractsDetails[id];
    const tokenToFetchPrice = getTokensPricesFromLocalCache(tokensToFetch);

    const wbtcLiquidity = this.calculateTokenLiquidity(
      multicallResult,
      avWBTCAddress,
      tokenToFetchPrice.BTC
    );
    const wethLiquidity = this.calculateTokenLiquidity(
      multicallResult,
      avWETHAddress,
      tokenToFetchPrice.ETH
    );
    const wcrvLiquidity = this.calculateTokenLiquidity(
      multicallResult,
      av3CRVAddress,
      tokenToFetchPrice.CRV
    );
    return { wbtcLiquidity, wethLiquidity, wcrvLiquidity };
  }

  calculateTokenLiquidity(
    multicallResult: MulticallParsedResponses,
    address: string,
    tokenToFetchPrice: Decimal
  ) {
    const balance = new Decimal(
      extractValueFromMulticallResponse(multicallResult, address, "balanceOf")
    );
    if (tokenToFetchPrice) {
      return balance.mul(tokenToFetchPrice);
    }
  }
}
