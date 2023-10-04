import Decimal from "decimal.js";
import {
  MulticallParsedResponse,
  MulticallParsedResponses,
} from "../../../../types";
import { IEvmRequestHandlers } from "../IEvmRequestHandlers";
import {
  buildMulticallRequests,
  MulticallRequest,
} from "../utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../utils/extract-value-from-multicall-response";
import { extractValuesWithTheSameNameFromMulticall } from "../utils/extract-values-with-same-name-from-multicall-response";
import { getTokensPricesFromLocalCache } from "../utils/get-tokens-prices-from-local-cache";
import { serializeDecimalsToDefault } from "../utils/serialize-decimals-to-default";

const BALANCES_FUNCTION_NAME = "balances";
const TOTAL_SUPPLY_FUNCTION_NAME = "totalSupply";

interface Tokens {
  name: string;
  decimals: number;
}
export interface TokenContractDetails {
  erc20Address: string;
  poolAddress: string;
  tokens: Tokens[];
}
export type TokenContractDetailsObject = Record<string, TokenContractDetails>;
export type CurveTokensContractsDetails = TokenContractDetailsObject & {
  abi: string;
  erc20abi: string;
};

export class CurveRequestHandlers implements IEvmRequestHandlers {
  constructor(
    private readonly curveTokensContractsDetails: CurveTokensContractsDetails
  ) {}

  prepareMulticallRequest(id: string) {
    const { erc20abi } = this.curveTokensContractsDetails;
    const { erc20Address } = this.curveTokensContractsDetails[id];
    const erc20BalanceRequests = this.prepareInternalRequestForCurveTokens(id);
    const functionsNamesWithValues = [{ name: TOTAL_SUPPLY_FUNCTION_NAME }];
    const totalSupplyRequest = buildMulticallRequests(
      erc20abi,
      erc20Address,
      functionsNamesWithValues
    );
    return [...erc20BalanceRequests, ...totalSupplyRequest];
  }

  prepareInternalRequestForCurveTokens = (id: string) => {
    const { tokens } = this.curveTokensContractsDetails[id];

    return tokens.reduce(
      (multicallRequests, _tokenName, tokenIndex) => [
        ...multicallRequests,
        ...this.buildBalanceRequest(id, tokenIndex),
      ],
      [] as MulticallRequest[]
    );
  };

  buildBalanceRequest(id: string, tokenIndex: number) {
    const { abi } = this.curveTokensContractsDetails;
    const { poolAddress } = this.curveTokensContractsDetails[id];

    return buildMulticallRequests(abi, poolAddress, [
      { name: BALANCES_FUNCTION_NAME, values: [tokenIndex] },
    ]);
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: string
  ): number | undefined {
    const { erc20Address } = this.curveTokensContractsDetails[id];
    const totalSupply = new Decimal(
      extractValueFromMulticallResponse(
        response,
        erc20Address,
        TOTAL_SUPPLY_FUNCTION_NAME
      )
    );
    const balancesSum = this.getTokenBalancesSum(response, id);
    return balancesSum.div(totalSupply).toNumber();
  }

  getTokenBalancesSum(multicallResult: MulticallParsedResponses, id: string) {
    const { tokens, poolAddress } = this.curveTokensContractsDetails[id];
    const tokensToFetchPrice = getTokensPricesFromLocalCache(
      tokens.map((token) => token.name)
    );

    const balances = extractValuesWithTheSameNameFromMulticall(
      multicallResult,
      poolAddress,
      BALANCES_FUNCTION_NAME
    );

    return CurveRequestHandlers.calculateTokenBalancesSum(
      balances,
      tokensToFetchPrice,
      tokens
    );
  }

  static calculateTokenBalancesSum(
    balanceResponses: MulticallParsedResponse[],
    tokensToFetchPrice: Record<string, Decimal>,
    tokens: Tokens[]
  ) {
    let balancesSum = new Decimal(0);
    for (const [tokenIndex, token] of Object.entries(tokens)) {
      const balanceResponse = balanceResponses[Number(tokenIndex)];
      if (balanceResponse.value) {
        const balanceAsDecimal = new Decimal(balanceResponse.value);
        const balanceSerialized = serializeDecimalsToDefault(
          balanceAsDecimal,
          token.decimals
        );
        const tokenPrice = tokensToFetchPrice[token.name];
        const balancePrice = balanceSerialized.mul(tokenPrice);
        balancesSum = balancesSum.add(balancePrice);
      }
    }
    return balancesSum;
  }
}
