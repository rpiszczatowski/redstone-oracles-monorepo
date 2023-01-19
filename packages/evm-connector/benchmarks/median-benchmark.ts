import { ethers } from "hardhat";
import { SampleNumericArrayLib } from "../typechain-types";
import { getRange } from "../src/helpers/test-utils";

const RUNS = 100;
const TEST_CASES = {
  array_length: [5, 10, 15, 20, 30, 40, 50, 100],
};
interface GasReport {
  sortMedian: number | string;
  quickSelectMedian: number | string;
}
interface BenchmarkTestCaseParams {
  arrayLength: number;
}

describe("MedianBenchmark", function () {
  let contract: SampleNumericArrayLib;
  const fullGasReport: any = {};

  const prepareRandomArray = (arrayLength: number) => {
    return getRange({ start: 0, length: arrayLength }).map(() =>
      Math.round(Math.random() * 10000)
    );
  };

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleNumericArrayLib"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  this.afterAll(async () => {
    console.log("=== FINAL GAS REPORT ===");
    console.log(JSON.stringify(fullGasReport, null, 2));
  });

  const updateFullGasReport = (
    benchmarkParams: BenchmarkTestCaseParams,
    gasReport: GasReport
  ) => {
    const benchmarkCaseKey = getBenchmarkCaseShortTitle(benchmarkParams);
    fullGasReport[benchmarkCaseKey] = gasReport;
  };

  const getBenchmarkCaseShortTitle = (
    benchmarkParams: BenchmarkTestCaseParams
  ): string => {
    return benchmarkParams.arrayLength + " array length";
  };

  const runBenchmarkTestCase = async (
    benchmarkParams: BenchmarkTestCaseParams
  ) => {
    const shortTitle = getBenchmarkCaseShortTitle(benchmarkParams);
    console.log(`Benchmark case testing started: ${shortTitle}`);

    let gasSortMedian = 0;
    let gasQuickSelectMedian = 0;

    try {
      for (let i = 0; i < RUNS; i++) {
        const arr = prepareRandomArray(benchmarkParams.arrayLength);

        const txSortMedian = await contract.testMedianSelection(arr);
        const txSortMedianReceipt = await txSortMedian.wait();

        const txQuickSelectMedian = await contract.testMedianSelectionLinear(
          arr
        );
        const txQuickSelectMedianReceipt = await txQuickSelectMedian.wait();
        gasSortMedian += txSortMedianReceipt.gasUsed.toNumber();
        gasQuickSelectMedian += txQuickSelectMedianReceipt.gasUsed.toNumber();
      }

      const gasReport: GasReport = {
        sortMedian: gasSortMedian / RUNS,
        quickSelectMedian: gasQuickSelectMedian / RUNS,
      };

      console.log({ gasReport });
      updateFullGasReport(benchmarkParams, gasReport);
    } catch (e) {
      console.log(e);
      const gasReport: GasReport = {
        sortMedian: "error-too-much-gas",
        quickSelectMedian: "error-too-much-gas",
      };
      updateFullGasReport(benchmarkParams, gasReport);
    }
  };

  for (const arrayLength of TEST_CASES.array_length) {
    const benchmarkParams: BenchmarkTestCaseParams = {
      arrayLength,
    };
    it(`Benchmark: ${getBenchmarkCaseShortTitle(
      benchmarkParams
    )}`, async () => {
      await runBenchmarkTestCase(benchmarkParams);
    });
  }
});
