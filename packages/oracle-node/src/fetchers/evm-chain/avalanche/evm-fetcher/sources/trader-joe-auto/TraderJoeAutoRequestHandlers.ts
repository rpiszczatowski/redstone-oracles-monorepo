import { BigNumber } from "ethers";
import { Interface } from "ethers/lib/utils";
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

const GET_BALANCES_FUNCTION_NAME = "getBalances";
const TOTAL_SUPPLY_FUNCTION_NAME = "totalSupply";
const DECIMALS_FUNCTION_NAME = "decimals";

export class TraderJoeAutoRequestHandlers implements IEvmRequestHandlers {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  prepareMulticallRequest(id: TraderJoeAutoPoolTokensDetailsKeys) {
    const { abi, address } = traderJoeAutoPoolTokenContractDetails[id];
    const functionsNamesWithValues = [
      {
        name: GET_BALANCES_FUNCTION_NAME,
      },
      {
        name: TOTAL_SUPPLY_FUNCTION_NAME,
      },
      {
        name: DECIMALS_FUNCTION_NAME,
      },
    ];
    return buildMulticallRequests(abi, address, functionsNamesWithValues);
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  extractPrice(
    response: MulticallParsedResponses,
    id: TraderJoeAutoPoolTokensDetailsKeys
  ): number | undefined {
    const { tokensToFetch } = traderJoeAutoPoolTokenContractDetails[id];

    const { firstBalance, firstToken, secondBalance, secondToken } =
      TraderJoeAutoRequestHandlers.getBalances(response, id);

    const tokensPrices = getTokensPricesFromLocalCache(tokensToFetch);
    const firstTokenPrice = firstBalance.mul(tokensPrices[firstToken]);
    const secondTokenPrice = secondBalance.mul(tokensPrices[secondToken]);
    const pricesSum = firstTokenPrice.add(secondTokenPrice);

    const totalSupply = TraderJoeAutoRequestHandlers.getTotalSupply(
      response,
      id
    );

    return pricesSum.div(totalSupply).toNumber();
  }

  static getBalances(
    response: MulticallParsedResponses,
    id: TraderJoeAutoPoolTokensDetailsKeys
  ) {
    const { tokensToFetch, token0Decimals, token1Decimals } =
      traderJoeAutoPoolTokenContractDetails[id];

    const { firstBalance, secondBalance } =
      TraderJoeAutoRequestHandlers.extractBalances(response, id);

    const firstToken = tokensToFetch[0];
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

  static getTotalSupply(
    response: MulticallParsedResponses,
    id: TraderJoeAutoPoolTokensDetailsKeys
  ) {
    const { address } = traderJoeAutoPoolTokenContractDetails[id];

    const totalSupply = new Decimal(
      extractValueFromMulticallResponse(
        response,
        address,
        TOTAL_SUPPLY_FUNCTION_NAME
      )
    );
    const totalSupplyDecimals = new Decimal(
      extractValueFromMulticallResponse(
        response,
        address,
        DECIMALS_FUNCTION_NAME
      )
    ).toNumber();
    return serializeDecimalsToDefault(totalSupply, totalSupplyDecimals);
  }

  static extractBalances(
    response: MulticallParsedResponses,
    id: TraderJoeAutoPoolTokensDetailsKeys
  ) {
    const { abi, address } = traderJoeAutoPoolTokenContractDetails[id];
    const balancesResult = extractValueFromMulticallResponse(
      response,
      address,
      GET_BALANCES_FUNCTION_NAME
    );
    const contractInterface = new Interface(abi);
    const balancesDecoded = contractInterface.decodeFunctionResult(
      GET_BALANCES_FUNCTION_NAME,
      balancesResult
    );
    const firstBalanceAsHex = (
      balancesDecoded.amountX as BigNumber
    ).toHexString();
    const secondBalanceAsHex = (
      balancesDecoded.amountY as BigNumber
    ).toHexString();
    const firstBalance = new Decimal(firstBalanceAsHex);
    const secondBalance = new Decimal(secondBalanceAsHex);
    return { firstBalance, secondBalance };
  }
}
