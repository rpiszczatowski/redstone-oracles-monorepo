import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-value-from-multicall-response";
import { traderJoeAutoPoolTokenContractDetails } from "./traderJoeAutoPoolTokenContractsDetails";
import { MulticallParsedResponses } from "../../../../../../types";
import { getTokensPricesFromLocalCache } from "../../../../shared/utils/get-tokens-prices-from-local-cache";
import { serializeDecimalsToDefault } from "../../../../shared/utils/serialize-decimals-to-default";

export type TraderJoeAutoPoolTokensDetailsKeys =
  keyof typeof traderJoeAutoPoolTokenContractDetails;

const FIRST_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE = [0, 66];
const SECOND_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE = [66, 130];

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

    const firstBalanceSerialized = serializeDecimalsToDefault(
      firstBalance,
      token0Decimals
    );
    const secondBalanceSerialized = serializeDecimalsToDefault(
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
    return serializeDecimalsToDefault(totalSupply, totalSupplyDecimals);
  }
}
