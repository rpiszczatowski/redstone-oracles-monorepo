import { base64 } from "ethers/lib/utils";
import { DataPoint } from "./DataPoint";
import { NumericDataPoint } from "./NumericDataPoint";

// This function was moved to a separate file, because it was not
// possible to make it as a static method in the DataPoint class.
// It would cause circularly importing classes, which is not supported
// More info here: https://stackoverflow.com/a/44727578
export const deserializeDataPointFromObj = (plainObject: any): DataPoint => {
  const isNumeric = typeof plainObject.value == "number";
  if (isNumeric) {
    return new NumericDataPoint(plainObject);
  } else {
    return new DataPoint(plainObject.symbol, base64.decode(plainObject.value));
  }
};
