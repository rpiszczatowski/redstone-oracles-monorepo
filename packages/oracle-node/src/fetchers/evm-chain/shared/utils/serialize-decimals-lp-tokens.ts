import Decimal from "decimal.js";
import { TEN_AS_BASE_OF_POWER } from "../contants";

// We want to serialize all decimals to 18
const STABLECOIN_DECIMALS_DIFF_TO_EIGHTEEN = 12;
const BTC_DECIMALS_DIFF_TO_EIGHTEEN = 10;

export const serializeDecimalsForLpTokens = (
  tokenReserves: Record<string, Decimal>
) => {
  const serializedTokenReserves = {} as Record<string, Decimal>;
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
};
