import { JsNativeSafeNumber } from "./JsNativeSafeNumber";
import { NumberArg } from "./ISafeNumber";

/** Factory for SafeNumber */
export const SafeNumber = (numberLike: NumberArg) =>
  JsNativeSafeNumber.from(numberLike);
