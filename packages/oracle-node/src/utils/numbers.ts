import { Consola } from "consola";

const logger = require("./logger")("utils/numbers") as Consola;

export const safelyConvertAnyValueToNumber = (value: any): number => {
  if (["string", "number"].includes(typeof value)) {
    return Number(value);
  } else {
    logger.warn(
      `Value can not be converted to a valid number. Received: ${value}`
    );
    return NaN;
  }
};
