import { Duplex } from "stream";
import * as Stream from "stream";

export function readableStream(array: Uint8Array): Stream {
  const stream = new Duplex();

  stream.push(array);
  stream.push(null);

  return stream;
}
