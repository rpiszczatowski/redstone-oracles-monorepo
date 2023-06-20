import { BadRequestException, Logger } from "@nestjs/common";
import { BulkPostRequestBody } from "../data-packages/data-packages.controller";

// TODO: this should be in common package
export function stringifyError(e: any) {
  if (e === undefined) {
    return "undefined";
  } else if (e.response) {
    return JSON.stringify(e.response.data) + " | " + e.stack;
  } else if (e.toJSON) {
    return JSON.stringify(e.toJSON());
  } else {
    return e.stack || String(e);
  }
}

export function runPromiseWithLogging<T>(
  promise: Promise<T>,
  message: string,
  logger: Logger
): Promise<T> {
  return promise
    .then((result) => {
      logger.log(`Success: ${message}.`);
      return result;
    })
    .catch((error) => {
      logger.error(`Failure: ${message}. ${stringifyError(error)}`);
      throw error;
    });
}
export const assertContainsNonEmptyProp = <T>(object: T, keys: (keyof T)[]) => {
  const missingKeys = [];
  for (const key of keys) {
    if (!object[key] || object[key] === "") {
      missingKeys.push(key);
    }
  }
  if (missingKeys.length > 0) {
    throw new BadRequestException(
      `Missing keys in payload: ${missingKeys.join("; ")}`
    );
  }
};

export const assertArrayContainsNonEmptyProp = <T>(
  array: T[],
  keys: (keyof T)[]
) => {
  for (const object of array) {
    assertContainsNonEmptyProp(object, keys);
  }
};

export function validateBulkPostRequestBody(body: BulkPostRequestBody) {
  assertContainsNonEmptyProp(body, ["dataPackages", "requestSignature"]);
  assertArrayContainsNonEmptyProp(body.dataPackages, [
    "dataPoints",
    "signature",
    "timestampMilliseconds",
  ]);
  for (const dataPackage of body.dataPackages) {
    assertArrayContainsNonEmptyProp(dataPackage.dataPoints, [
      "dataFeedId",
      "value",
    ]);
  }
}
