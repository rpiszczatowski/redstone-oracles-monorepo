import { BigNumber } from "ethers";
import { JsNativeSafeNumber } from "./JsNativeSafeNumber";
import { ISafeNumber, NumberArg } from "./ISafeNumber";
import { SafeBigNumber } from "./SafeBigNumber";

/** Factory for SafeNumber */
export const createSafeNumber = (
  numberLike: NumberArg,
  decimals: number = 0
) => {
  if (numberLike instanceof BigNumber || numberLike instanceof SafeBigNumber) {
    return SafeBigNumber.from(numberLike, decimals);
  } else if (
    typeof numberLike === "number" ||
    numberLike instanceof JsNativeSafeNumber
  ) {
    return JsNativeSafeNumber.from(numberLike);
  } else if (typeof numberLike === "string") {
    return createNumberOrBigNumber(numberLike, decimals);
  }
  throw new Error("Error while creating safe number, invalid number like type");
};

export const parseSafeNumberValueForBroadcasting = (value: ISafeNumber) => {
  if (value instanceof JsNativeSafeNumber) {
    return value.unsafeToNumber();
  } else if (value instanceof SafeBigNumber) {
    return value.toString();
  }
  throw new Error(
    "Error while parsing for broadcasting, invalid number like type"
  );
};

export const createNumberOrBigNumber = (
  numberLike: number | string,
  decimals: number = 0
) => {
  try {
    const isNumberLikeBiggerThanMax = BigNumber.from(numberLike).gte(
      BigNumber.from(Number.MAX_SAFE_INTEGER.toString())
    );
    if (isNumberLikeBiggerThanMax) {
      return SafeBigNumber.from(numberLike, decimals);
    } else {
      return JsNativeSafeNumber.from(numberLike);
    }
  } catch {
    return JsNativeSafeNumber.from(numberLike);
  }
};
