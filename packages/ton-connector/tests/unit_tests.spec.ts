import { createTesterContractEnv } from "./helpers/test_helpers";
import { TonUnitTesterContractDeployer } from "./unit_tester/TonUnitTesterContractDeployer";
import { TonUnitTesterContractAdapter } from "./unit_tester/TonUnitTesterContractAdapter";
import {
  DATA_FEED_ID_BS,
  DATA_POINT_VALUE_BYTE_SIZE_BS,
  DATA_POINTS_COUNT_BS,
  TIMESTAMP_BS,
} from "redstone-protocol/dist/src/common/redstone-constants";
import {
  DATA_PACKAGE_DATA_1,
  DATA_PACKAGE_DATA_2,
} from "./helpers/test_helpers";

describe("TON unit Tests", () => {
  let testerAdapter: TonUnitTesterContractAdapter;

  beforeAll(async () => {
    const { network, testerCode } = await createTesterContractEnv("unit_tests");

    testerAdapter = await new TonUnitTesterContractDeployer(
      network,
      testerCode
    ).getAdapter();
  });

  it("recover signer address 1c", async () => {
    expect(
      await testerAdapter.testGetDataPackageSignerAddress(
        DATA_PACKAGE_DATA_1,
        "333ecb944d5fc5de0dd6eb264ed2134cfb5e9b5db4933d9bfbdb15c4e71f70b729b1be6f047d78691cd459268213e294b4d66c544e9953b88f9f0bfb2c77159b1c"
      )
    ).toBe("0x12470f7aBA85c8b81D63137DD5925D6EE114952b".toLowerCase());
  });

  it("recover signer address 1b", async () => {
    expect(
      await testerAdapter.testGetDataPackageSignerAddress(
        DATA_PACKAGE_DATA_2,
        "18d7684f83d8fe57447c5e23c14ada832b6567484c02117ab9294b909b0435450531c01b9882b91983032cc18504820008d798e95e1b3a68c79a11b346994a921b"
      )
    ).toBe("0x1eA62d73EdF8AC05DfceA1A34b9796E937a29EfF".toLowerCase());
  });

  it("median for sorted arrays", async () => {
    [
      { numbers: [1, 3, 7], expectedMedian: 3 },
      { numbers: [1, 7], expectedMedian: 4 },
      { numbers: [1, 7, 7], expectedMedian: 7 },
      { numbers: [1, 7, 7, 7], expectedMedian: 7 },
      {
        numbers: [15],
        expectedMedian: 15,
      },
    ].forEach(async (caseData) => {
      expect(await testerAdapter.testMedian(caseData.numbers)).toBe(
        caseData.expectedMedian
      );
    });
  });

  it("median for unsorted arrays", async () => {
    [
      { numbers: [7, 1, 3], expectedMedian: 3 },
      { numbers: [3, 1, 7], expectedMedian: 3 },
      { numbers: [3, 1, 7, 12], expectedMedian: 5 },
      { numbers: [12, 3, 1, 7], expectedMedian: 5 },
      { numbers: [7, 1], expectedMedian: 4 },
    ].forEach(async (caseData) => {
      expect(await testerAdapter.testMedian(caseData.numbers)).toBe(
        caseData.expectedMedian
      );
    });
  });

  it("median for empty array should reject", async () => {
    expect(testerAdapter.testMedian([])).rejects.toHaveProperty(
      "exitCode",
      999
    );
  });

  it("slice integer from string", async () => {
    const { slice, value: dataPointCount } = await testerAdapter.testSliceInt(
      DATA_PACKAGE_DATA_1,
      DATA_POINTS_COUNT_BS
    );

    expect(dataPointCount).toBe(1n);

    const { slice: slice2, value: valueByteSize } =
      await testerAdapter.testSliceInt(slice, DATA_POINT_VALUE_BYTE_SIZE_BS);

    expect(valueByteSize).toBe(32n);

    const { slice: slice3, value: timestamp } =
      await testerAdapter.testSliceInt(slice2, TIMESTAMP_BS);

    expect(timestamp).toBe(1678113550000n);

    const { slice: slice4, value: price } = await testerAdapter.testSliceInt(
      slice3,
      32
    );

    expect(price).toBe(156954083908n);
    expect(slice4.bits.length).toBe(DATA_FEED_ID_BS * 8);
  });

  it("slice integer from string for extreme lengths", async () => {
    expect(
      testerAdapter.testSliceInt(DATA_PACKAGE_DATA_1, 33)
    ).rejects.toHaveProperty("exitCode", 997);

    expect(testerAdapter.testSliceInt("", 1)).rejects.toHaveProperty(
      "exitCode",
      9
    );

    expect(
      (await testerAdapter.testSliceInt(DATA_PACKAGE_DATA_1, 0)).value
    ).toBe(0n);
  });
});
