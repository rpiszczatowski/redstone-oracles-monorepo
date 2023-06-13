import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-value-from-multicall-response";
import { traderJoeAutoPoolTokenContractDetails } from "./traderJoeAutoPoolTokenContractsDetails";
import { MulticallParsedResponses } from "../../../../../../types";
import { TEN_AS_BASE_OF_POWER } from "../../../../shared/contants";
import { getTokensPricesFromLocalCache } from "../../../../shared/utils/get-tokens-prices-from-local-cache";

export type TraderJoeAutoPoolTokensDetailsKeys =
  keyof typeof traderJoeAutoPoolTokenContractDetails;

const FIRST_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE = [0, 66];
const SECOND_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE = [66, 130];
const DEFAULT_DECIMALS = 18;

export class TraderJoeAutoRequestHandlers implements IEvmRequestHandlers {
  prepareMulticallRequest(id: TraderJoeAutoPoolTokensDetailsKeys) {
    const { abi, address } = traderJoeAutoPoolTokenContractDetails[id];
    const functionsNamesWithValues = [
      {
        name: "getBalances",
      },
      {
        name: "totalSupply",
      },
      {
        name: "decimals",
      },
    ];
    return buildMulticallRequests(abi, address, functionsNamesWithValues);
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: TraderJoeAutoPoolTokensDetailsKeys
  ): number | undefined {
    const { tokensToFetch } = traderJoeAutoPoolTokenContractDetails[id];

    const { firstBalance, firstToken, secondBalance, secondToken } =
      this.getBalances(response, id);

    const tokensPrices = getTokensPricesFromLocalCache(tokensToFetch);
    const firstTokenPrice = firstBalance.mul(tokensPrices[firstToken]);
    const secondTokenPrice = secondBalance.mul(tokensPrices[secondToken]);
    const pricesSum = firstTokenPrice.add(secondTokenPrice);

    const totalSupply = this.getTotalSupply(response, id);

    return pricesSum.div(totalSupply).toNumber();
  }

  getBalances(
    response: MulticallParsedResponses,
    id: TraderJoeAutoPoolTokensDetailsKeys
  ) {
    const { address, tokensToFetch, token0Decimals, token1Decimals } =
      traderJoeAutoPoolTokenContractDetails[id];

    const balances = extractValueFromMulticallResponse(
      response,
      address,
      "getBalances"
    );
    const firstBalance = new Decimal(
      balances.slice(...FIRST_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE)
    );
    const firstToken = tokensToFetch[0];
    const secondBalance = new Decimal(
      `0x${balances.slice(...SECOND_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE)}`
    );
    const secondToken = tokensToFetch[1];

    const firstBalanceSerialized = this.serializeDecimals(
      firstBalance,
      token0Decimals
    );
    const secondBalanceSerialized = this.serializeDecimals(
      secondBalance,
      token1Decimals
    );

    return {
      firstToken,
      firstBalance: firstBalanceSerialized,
      secondToken,
      secondBalance: secondBalanceSerialized,
    };
  }

  getTotalSupply(
    response: MulticallParsedResponses,
    id: TraderJoeAutoPoolTokensDetailsKeys
  ) {
    const { address } = traderJoeAutoPoolTokenContractDetails[id];

    const totalSupply = new Decimal(
      extractValueFromMulticallResponse(response, address, "totalSupply")
    );
    const totalSupplyDecimals = new Decimal(
      extractValueFromMulticallResponse(response, address, "decimals")
    ).toNumber();
    return this.serializeDecimals(totalSupply, totalSupplyDecimals);
  }

  serializeDecimals(balance: Decimal, tokenDecimals: number) {
    const serializedDecimals = DEFAULT_DECIMALS - tokenDecimals;
    const multiplier = new Decimal(TEN_AS_BASE_OF_POWER).toPower(
      serializedDecimals
    );
    return balance.mul(multiplier);
  }
}
