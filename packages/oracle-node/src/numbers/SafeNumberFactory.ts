import { BigNumber } from "ethers";
import { JsNativeSafeNumber } from "./JsNativeSafeNumber";
import { ISafeNumber, NumberArg } from "./ISafeNumber";
import { SafeBigNumber } from "./SafeBigNumber";

/** Factory for SafeNumber */
export const createSafeNumber = (
  numberLike: NumberArg,
  decimals: number = 0
) => {
  if (
    typeof numberLike === "number" ||
    typeof numberLike === "string" ||
    numberLike instanceof JsNativeSafeNumber
  ) {
    return JsNativeSafeNumber.from(numberLike);
  } else if (numberLike instanceof BigNumber) {
    return SafeBigNumber.from(numberLike, decimals);
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
