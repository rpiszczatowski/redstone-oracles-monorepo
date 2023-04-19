import {
  NumberValidationResult,
  setJsNativeRedstoneNumberConfig,
} from "../src/numbers/JsNativeRedstoneNumber";

const throwErr = (msg: string) => {
  throw new Error(msg);
};

setJsNativeRedstoneNumberConfig({
  ON_NUMBER_VALIDATION_ERROR: {
    [NumberValidationResult.isNaN]: throwErr,
    [NumberValidationResult.isNotFinite]: throwErr,
    [NumberValidationResult.isOverflow]: throwErr,
    [NumberValidationResult.isUnderflow]: throwErr,
  },
});
