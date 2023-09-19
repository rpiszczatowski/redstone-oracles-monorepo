import util from "util";

const log = (val: unknown) => {
  console.log(util.inspect(val, { depth: null, colors: true }));
};

export default {
  log,
};
