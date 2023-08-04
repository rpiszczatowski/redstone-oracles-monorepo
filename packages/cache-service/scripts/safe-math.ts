export type ConvertibleToISafeNumber = number | string | Decimal | ISafeNumber;

export const castToISafeNumber = (
  numberLike: ConvertibleToISafeNumber
): ISafeNumber => {
  if (typeof numberLike === "string" || typeof numberLike === "number") {
    return createSafeNumber(numberLike.toString());
  } else if (numberLike instanceof Decimal) {
    return createSafeNumber(numberLike.toString());
  } else if (numberLike.isSafeNumber()) {
    return numberLike;
  } else {
    throw new Error(`Can not cast ${numberLike} to ISafeNumber`);
  }
};

export const calculateDeviationPercent = (args: {
  prevValue: ConvertibleToISafeNumber;
  newValue: ConvertibleToISafeNumber;
}) =>
  ISafeNumberMath.calculateDeviationPercent({
    prevValue: castToISafeNumber(args.prevValue),
    currValue: castToISafeNumber(args.newValue),
  }).unsafeToNumber();

  const result = prevValue.sub(currValue).div(currValue).abs().mul(100);

// getDeviationPercentage(a: number, b: number) {
//   return Math.abs((a - b) / Math.min(a, b)) * 100;
// }

// export const calculateDeviationPercent = (args: {
//   prevValue: ConvertibleToISafeNumber;
//   newValue: ConvertibleToISafeNumber;
// }) =>
//   ISafeNumberMath.calculateDeviationPercent({
//     prevValue: castToISafeNumber(args.prevValue),
//     currValue: castToISafeNumber(args.newValue),
//   }).unsafeToNumber();

// export const castToISafeNumber = (
//   numberLike: ConvertibleToISafeNumber
// ): ISafeNumber => {
//   if (typeof numberLike === "string" || typeof numberLike === "number") {
//     return createSafeNumber(numberLike.toString());
//   } else if (numberLike instanceof Decimal) {
//     return createSafeNumber(numberLike.toString());
//   } else if (numberLike.isSafeNumber()) {
//     return numberLike;
//   } else {
//     throw new Error(`Can not cast ${numberLike} to ISafeNumber`);
//   }
// };

// export const calculateDeviationPercent = (args: {
//   prevValue: ISafeNumber;
//   currValue: ISafeNumber;
// }) => {
//   const { prevValue, currValue } = args;

//   if (currValue.eq(0)) {
//     return createSafeNumber(Number.MAX_SAFE_INTEGER);
//   }

//   const result = prevValue.sub(currValue).div(currValue).abs().mul(100);

//   return result;
// };

// export interface ISafeNumber {
//   add(numberLike: NumberArg): ISafeNumber;
//   sub(numberLike: NumberArg): ISafeNumber;
//   div(numberLike: NumberArg): ISafeNumber;
//   mul(numberLike: NumberArg): ISafeNumber;
//   eq(numberLike: NumberArg): boolean;
//   lt(numberLike: NumberArg): boolean;
//   lte(numberLike: NumberArg): boolean;
//   gt(numberLike: NumberArg): boolean;
//   gte(numberLike: NumberArg): boolean;
//   abs(): ISafeNumber;
//   decimals(): number;
//   assertNonNegative(): void;
//   /** Convert number to string without loosing precision */
//   toString(): string;
//   unsafeToNumber(): number;
//   isSafeNumber(): boolean;
// }
