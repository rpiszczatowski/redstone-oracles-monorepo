import { JsNativeRedstoneNumber } from "./JsNativeRedstoneNumber";
import { NumberArg } from "./RedstoneNumber";

/** Factory for RedstoneNumber */
export const N = (numberLike: NumberArg) =>
  JsNativeRedstoneNumber.from(numberLike);
