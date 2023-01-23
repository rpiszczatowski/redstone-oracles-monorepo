export const range = (start: BigInt, stop: BigInt, step: BigInt) => {
  if (typeof stop == "undefined") {
    stop = start;
    start = BigInt(0);
  }

  if (typeof step == "undefined") {
    step = BigInt(1);
  }

  if (
    (step > BigInt(0) && start >= stop) ||
    (step < BigInt(0) && start <= stop)
  ) {
    return [];
  }

  let result: any = [];
  for (
    let i: any = start;
    step > BigInt(0) ? i < stop : i > stop;
    i = i + step
  ) {
    result.push(i);
  }

  return result;
};
