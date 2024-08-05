import fs from "fs";
import WebSocket from "ws";

export function mergeObjects<T = unknown>(objects: Array<unknown>) {
  return Object.assign({}, ...objects) as T;
}

export function readJSON<T = unknown>(path: string): T {
  const content = fs.readFileSync(path, "utf-8");
  try {
    return JSON.parse(content) as T;
  } catch (e) {
    throw new Error(`File "${path}" does not contain a valid JSON`);
  }
}

export function getRequiredPropValue<T = unknown>(
  obj: { [x: string]: unknown },
  prop: string
): T {
  if (obj[prop] === undefined) {
    throw new Error(
      `Object does not contain required property "${prop}". Obj: ` +
        JSON.stringify(obj)
    );
  }

  return obj[prop] as T;
}

export function isDefined(value: unknown) {
  return value !== null && value !== undefined;
}

export function stringifyData(message: WebSocket.Data): string {
  return typeof message === "object"
    ? JSON.stringify(message)
    : message.toString();
}
