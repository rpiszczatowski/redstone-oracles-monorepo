import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-value-from-multicall-response";
import { balancerTokensContractDetails } from "./balancerTokensContractDetails";
import { MulticallParsedResponses } from "../../../../../../types";
import { getLastPrice } from "../../../../../../db/local-db";
import { TEN_AS_BASE_OF_POWER } from "../../../../shared/contants";

export type BalancerTokensDetailsKeys =
  keyof typeof balancerTokensContractDetails;

const FIRST_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE = [578, 642];
const SECOND_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE = [642, 706];
const TOKEN_RATE_DECIMALS = 18;

export class BalancerRequestHandlers implements IEvmRequestHandlers {
  prepareMulticallRequest(id: BalancerTokensDetailsKeys) {
    const { abi, address, vaultAbi, vaultAddress, poolId } =
      balancerTokensContractDetails[id];
    const vaultFunction = {
      name: "getPoolTokens",
      values: [poolId],
    };
    const poolFunctions = [
      {
        name: "getVirtualSupply",
      },
      {
        name: "getWrappedTokenRate",
      },
    ];

    const vaultMulticallRequests = buildMulticallRequests(
      vaultAbi,
      vaultAddress,
      [vaultFunction]
    );
    const poolMulticallRequests = buildMulticallRequests(
      abi,
      address,
      poolFunctions
    );
    return [...vaultMulticallRequests, ...poolMulticallRequests];
  }

  /*
    We calculate price based on https://docs.balancer.fi/reference/lp-tokens/valuing.html#valuing
    as sum of balances multiplied by token price, then sum is divided by total supply.
    As we have wrapped AAVE token like waWETH (which price us unknown) we use wrapped token rate to 
    define ratio between waWETH and WETH.
  */
  extractPrice(
    response: MulticallParsedResponses,
    id: BalancerTokensDetailsKeys
  ): number | undefined {
    const { address, vaultAddress, tokenToFetch } =
      balancerTokensContractDetails[id];

    const { firstTokenBalance, secondTokenBalance } = this.getTokenBalances(
      response,
      vaultAddress
    );

    const { totalSupply, wrappedTokenRate } = this.getTotalSupplyAndTokenRate(
      response,
      address
    );

    const tokenPrice = getLastPrice(tokenToFetch);
    if (!tokenPrice) {
      throw new Error(`Cannot get last price of ${tokenPrice}`);
    }

    const firstTokenValue = firstTokenBalance
      .mul(tokenPrice.value)
      .mul(wrappedTokenRate);
    const secondTokenValue = secondTokenBalance.mul(tokenPrice.value);
    const tokensValue = firstTokenValue.add(secondTokenValue);
    return tokensValue.div(totalSupply).toNumber();
  }

  private getTokenBalances(
    response: MulticallParsedResponses,
    vaultAddress: string
  ) {
    const poolTokensResponse = extractValueFromMulticallResponse(
      response,
      vaultAddress,
      "getPoolTokens"
    );
    const firstTokenBalance = new Decimal(
      `0x${poolTokensResponse.slice(
        ...FIRST_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE
      )}`
    );
    const secondTokenBalance = new Decimal(
      `0x${poolTokensResponse.slice(
        ...SECOND_TOKEN_INDEXES_FROM_CONTRACT_RESPONSE
      )}`
    );

    return { firstTokenBalance, secondTokenBalance };
  }

  private getTotalSupplyAndTokenRate(
    response: MulticallParsedResponses,
    address: string
  ) {
    const totalSupplyResponse = extractValueFromMulticallResponse(
      response,
      address,
      "getVirtualSupply"
    );
    const totalSupply = new Decimal(totalSupplyResponse);
    const wrappedTokenRateResponse = extractValueFromMulticallResponse(
      response,
      address,
      "getWrappedTokenRate"
    );
    const divider = new Decimal(TEN_AS_BASE_OF_POWER).toPower(
      TOKEN_RATE_DECIMALS
    );
    const wrappedTokenRate = new Decimal(wrappedTokenRateResponse).div(divider);

    return { totalSupply, wrappedTokenRate };
  }
}
