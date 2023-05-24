import * as JsNativeSafeNumber from "../src/numbers/JsNativeSafeNumber";

const throwErr = (msg: string) => {
  throw new Error(msg);
};

JsNativeSafeNumber.JsNativeSafeNumberConfig.ON_NUMBER_VALIDATION_ERROR = {
  [JsNativeSafeNumber.NumberValidationResult.isNaN]: throwErr,
  [JsNativeSafeNumber.NumberValidationResult.isNotFinite]: throwErr,
  [JsNativeSafeNumber.NumberValidationResult.isOverflow]: throwErr,
  [JsNativeSafeNumber.NumberValidationResult.isUnderflow]: throwErr,
};
