import { sqrt } from "../../src/utils/math";
import { BigNumber } from "ethers";

describe("BigNum Sqrt Test", () => {
  test("Should properly square integers", async () => {
    const number = BigNumber.from(9);

    const result = sqrt(number);

    expect(result.toNumber()).toEqual(3);
  });

  test("Should properly square big integers", async () => {
    const number = BigNumber.from(999999999).mul(BigNumber.from(999999999));

    const result = sqrt(number);

    expect(result.toNumber()).toEqual(999999999);
  });

  test("Should properly floor square big integers", async () => {
    const number = BigNumber.from(5);

    const result = sqrt(number);

    expect(result.toNumber()).toEqual(2);
  });
});
