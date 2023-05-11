import { Decimal } from "decimal.js";
import { IEvmRequestHandlers } from "../../../../shared/IEvmRequestHandlers";
import { buildMulticallRequests } from "../../../../shared/utils/build-multicall-request";
import { extractValueFromMulticallResponse } from "../../../../shared/utils/extract-prices";
import { getLastPrice } from "../../../../../../db/local-db";
import { dexLpTokensContractsDetails } from ".";
import { MulticallParsedResponses } from "../../../../../../types";
import { TEN_AS_BASE_OF_POWER } from "../../../../shared/contants";

// Fair LP Token Pricing has been implemented with the help of: https://blog.alphaventuredao.io/fair-lp-token-pricing/

export type DexLpTokensDetailsKeys = keyof typeof dexLpTokensContractsDetails;

type TokenReserve = Record<string, Decimal>;

// We want to serialize all decimals to 18
const STABLECOIN_DECIMALS_DIFF_TO_EIGHTEEN = 12;
const BTC_DECIMALS_DIFF_TO_EIGHTEEN = 10;

export class DexLpTokensRequestHandler implements IEvmRequestHandlers {
  prepareMulticallRequest(id: DexLpTokensDetailsKeys) {
    const { abi, address } = dexLpTokensContractsDetails[id];
    const functionsNamesWithValues = [
      { name: "getReserves" },
      { name: "totalSupply" },
    ];
    return buildMulticallRequests(abi, address, functionsNamesWithValues);
  }

  extractPrice(
    response: MulticallParsedResponses,
    id: DexLpTokensDetailsKeys
  ): number | undefined {
    const { address, tokensToFetch } = dexLpTokensContractsDetails[id];
    const reserves = extractValueFromMulticallResponse(
      response,
      address,
      "getReserves"
    );

    const firstTokenReserve = new Decimal(reserves.slice(0, 66));
    const firstToken = tokensToFetch[0];
    const secondTokenReserve = new Decimal(`0x${reserves.slice(66, 130)}`);
    const secondToken = tokensToFetch[1];
    const tokenReserves = {
      [firstToken]: firstTokenReserve,
      [secondToken]: secondTokenReserve,
    };

    const tokensReservesPrices =
      this.getReservesTokensPricesFromDb(tokenReserves);
    console.log({ tokensReservesPrices });
    const reservesSerialized = this.serializeDecimals(tokenReserves);
    console.log({ reservesSerialized });

    if (
      tokensReservesPrices &&
      this.checkIfAllTokensFetched(tokensReservesPrices, tokenReserves)
    ) {
      const firstTokenReservePrice = tokensReservesPrices[firstToken];
      const secondTokenReservePrice = tokensReservesPrices[secondToken];

      const firstReserve = reservesSerialized[firstToken];
      const secondReserve = reservesSerialized[secondToken];

      const reservesMultiplied = firstReserve.mul(secondReserve);
      const pricesMultiplied = firstTokenReservePrice.mul(
        secondTokenReservePrice
      );

      const reservesMultipliedSqrt = reservesMultiplied.sqrt();
      const pricesMultipliedSqrt = pricesMultiplied.sqrt();

      const reservesPricesMultiplied =
        reservesMultipliedSqrt.mul(pricesMultipliedSqrt);

      const totalSupply = new Decimal(
        extractValueFromMulticallResponse(response, address, "totalSupply")
      );

      return reservesPricesMultiplied.div(totalSupply).mul(2).toNumber();
    }
  }

  getReservesTokensPricesFromDb(tokenReserves: TokenReserve) {
    const tokenNames = Object.keys(tokenReserves);
    const pricesObject: Record<string, Decimal> = {};
    for (const token of tokenNames) {
      const tokenPriceFromDb = getLastPrice(token);
      if (tokenPriceFromDb) {
        const price = tokenPriceFromDb.value;
        pricesObject[token] = new Decimal(price);
      }
    }
    return pricesObject;
  }

  serializeDecimals(tokenReserves: TokenReserve) {
    const serializedTokenReserves = {} as TokenReserve;
    for (const tokenName of Object.keys(tokenReserves)) {
      let tokenReserveSerialized = tokenReserves[tokenName];
      if (["USDC", "USDT"].includes(tokenName)) {
        const multiplier = new Decimal(TEN_AS_BASE_OF_POWER).toPower(
          STABLECOIN_DECIMALS_DIFF_TO_EIGHTEEN
        );
        tokenReserveSerialized = tokenReserves[tokenName].mul(multiplier);
      } else if (tokenName === "BTC") {
        const multiplier = new Decimal(TEN_AS_BASE_OF_POWER).toPower(
          BTC_DECIMALS_DIFF_TO_EIGHTEEN
        );
        tokenReserveSerialized = tokenReserves[tokenName].mul(multiplier);
      }
      serializedTokenReserves[tokenName] = tokenReserveSerialized;
    }
    return serializedTokenReserves;
  }

  checkIfAllTokensFetched(
    pricesObject: Record<string, Decimal>,
    tokenReserves: TokenReserve
  ) {
    return (
      Object.keys(pricesObject).length === Object.keys(tokenReserves).length
    );
  }
}
