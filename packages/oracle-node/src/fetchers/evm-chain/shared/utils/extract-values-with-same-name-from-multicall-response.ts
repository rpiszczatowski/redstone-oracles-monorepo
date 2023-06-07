import { MulticallParsedResponses } from "../../../../types";

export const extractValuesWithTheSameNameFromMulticall = (
  multicallResult: MulticallParsedResponses,
  address: string,
  id: string
): Array<string | undefined> => {
  const results = multicallResult[address];
  if (!results) {
    throw new Error(`Multicall results for [${address}] is empty`);
  }

  const values = results.map((result) => result[id]);
  if (values.some((value) => !value)) {
    throw new Error(
      `Multicall results doesn't contain some value for [${address}][${id}]`
    );
  }
  return values;
};
