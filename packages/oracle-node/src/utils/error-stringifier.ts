export function stringifyError(e: any) {
  if (e === undefined || e === null) {
    return "undefined";
  } else if (e.response && e.response.data) {
    return JSON.stringify(e.response.data) + " | " + e.stack;
  } else if (e.toJSON) {
    return JSON.stringify(e.toJSON());
  } else {
    return e.stack || String(e);
  }
}
