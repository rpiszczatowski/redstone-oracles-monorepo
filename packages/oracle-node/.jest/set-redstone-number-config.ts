import {
  NumberValidationResult,
  setJsNativeSafeNumberConfig,
} from "../src/numbers/JsNativeSafeNumber";

const throwErr = (msg: string) => {
  throw new Error(msg);
};

setJsNativeSafeNumberConfig({
  ON_NUMBER_VALIDATION_ERROR: {
    [NumberValidationResult.isNaN]: throwErr,
    [NumberValidationResult.isNotFinite]: throwErr,
    [NumberValidationResult.isOverflow]: throwErr,
    [NumberValidationResult.isUnderflow]: throwErr,
  },
});
