/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stringifyError(e: any): string {
  if (e === undefined || e === null) {
    return "undefined";
  } else if (e.response?.data) {
    return JSON.stringify(e.response.data) + " | " + e.stack;
  } else if (e.toJSON) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return JSON.stringify(e.toJSON());
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return e.stack || String(e);
  }
}
