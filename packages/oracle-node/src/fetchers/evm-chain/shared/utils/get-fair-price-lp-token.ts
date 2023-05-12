import Decimal from "decimal.js";
import { getTokensPricesFromLocalCache } from "./get-tokens-prices-from-local-cache";

// Fair LP Token Pricing has been implemented with the help of: https://blog.alphaventuredao.io/fair-lp-token-pricing/

export const getFairPriceForLpToken = (
  tokenReserves: Record<string, Decimal>,
  totalSupply: Decimal
) => {
  const tokenNames = Object.keys(tokenReserves);
  const tokensReservesPrices = getTokensPricesFromLocalCache(tokenNames);

  if (checkIfAllTokensFetched(tokensReservesPrices, tokenReserves)) {
    const tokenReservesEntries = Object.entries(tokenReserves);
    const [firstToken, firstReserve] = tokenReservesEntries[0];
    const [secondToken, secondReserve] = tokenReservesEntries[1];
    const firstTokenReservePrice = tokensReservesPrices[firstToken];
    const secondTokenReservePrice = tokensReservesPrices[secondToken];

    const reservesMultiplied = firstReserve.mul(secondReserve);
    const pricesMultiplied = firstTokenReservePrice.mul(
      secondTokenReservePrice
    );

    const reservesMultipliedSqrt = reservesMultiplied.sqrt();
    const pricesMultipliedSqrt = pricesMultiplied.sqrt();

    const reservesPricesMultiplied =
      reservesMultipliedSqrt.mul(pricesMultipliedSqrt);

    return reservesPricesMultiplied.div(totalSupply).mul(2).toNumber();
  }
};

function checkIfAllTokensFetched(
  tokensReservesPrices: Record<string, Decimal>,
  tokenReserves: Record<string, Decimal>
) {
  return (
    Object.keys(tokensReservesPrices).length ===
    Object.keys(tokenReserves).length
  );
}
