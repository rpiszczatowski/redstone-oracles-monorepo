export const timeout = <T>(prom: Promise<T>, timeoutMS: number): Promise<T> => {
  let timer: NodeJS.Timeout;
  return Promise.race<T>([
    prom,
    new Promise((_r, rej) => (timer = setTimeout(rej, timeoutMS))),
  ]).finally(() => clearTimeout(timer));
};