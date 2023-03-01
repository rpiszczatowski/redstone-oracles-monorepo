import { BigNumber } from "ethers";

const ONE = BigNumber.from(1);
const TWO = BigNumber.from(2);

export const sqrt = (value: BigNumber) => {
  const x = BigNumber.from(value);
  let z = x.add(ONE).div(TWO);
  let y = x;
  while (z.sub(y).isNegative()) {
    y = z;
    z = x.div(z).add(z).div(TWO);
  }
  return y;
};
