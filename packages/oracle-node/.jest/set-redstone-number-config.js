import {
    setJsNativeRedstoneNumberConfig,
} from "../src/numbers/JsNativeRedstoneNumber";

const throwErr = msg => { throw new Error(msg) };

setJsNativeRedstoneNumberConfig({
    ON_NUMBER_VALIDATION_ERROR: {
        1: throwErr,
        2: throwErr,
        3: throwErr,
        4: throwErr
    }
});
