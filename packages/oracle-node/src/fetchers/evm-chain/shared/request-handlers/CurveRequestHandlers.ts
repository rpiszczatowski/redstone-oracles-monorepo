import Decimal from "decimal.js";
import { MulticallParsedResponses } from "../../../../types";
import { IEvmRequestHandlers } from "../IEvmRequestHandlers";
import {
  buildMulticallRequests,
  MulticallRequest,
} from "../utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../utils/extract-value-from-multicall-response";
import { extractValuesWithTheSameNameFromMulticall } from "../utils/extract-values-with-same-name-from-multicall-response";
import { getTokensPricesFromLocalCache } from "../utils/get-tokens-prices-from-local-cache";
import { serializeDecimalsToDefault } from "../utils/serialize-decimals-to-default";

interface Tokens {
  name: string;
  decimals: number;
}
interface TokenContractDetails {
  erc20Address: string;
  poolAddress: string;
  tokens: Tokens[];
}
type TokenContractDetailsObject = Record<string, TokenContractDetails>;
type CurveTokensContractsDetails = TokenContractDetailsObject & {
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
    const functionsNamesWithValues = [{ name: "totalSupply" }];
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
      { name: "balances", values: [tokenIndex] },
    ]);
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: string
  ): number | undefined {
    const { erc20Address } = this.curveTokensContractsDetails[id];
    const totalSupply = new Decimal(
      extractValueFromMulticallResponse(response, erc20Address, "totalSupply")
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
      "balances"
    );

    return this.calculateTokenBalancesSum(balances, tokensToFetchPrice, tokens);
  }

  calculateTokenBalancesSum(
    balances: (string | undefined)[],
    tokensToFetchPrice: Record<string, Decimal>,
    tokens: Tokens[]
  ) {
    let balancesSum = new Decimal(0);
    for (const [tokenIndex, token] of Object.entries(tokens)) {
      const balance = balances[Number(tokenIndex)];
      if (balance) {
        const balanceAsDecimal = new Decimal(balance);
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
