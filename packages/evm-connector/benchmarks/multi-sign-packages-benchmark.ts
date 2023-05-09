import { ethers } from "hardhat";
import { DataPackage, NumericDataPoint } from "redstone-protocol";
import { utils } from "redstone-protocol";
import {
  MOCK_SIGNERS,
  DEFAULT_TIMESTAMP_FOR_TESTS,
  MockSignerAddress,
} from "../src/helpers/test-utils";
import { WrapperBuilder } from "../src/index";
import { MockDataPackageConfig } from "../src/wrappers/MockWrapper";
import { MockMultiSignDataPackageConfig } from "../src/wrappers/MockWrapperMultiSign";
import { Benchmark } from "../typechain-types";

interface BenchmarkTestCaseParams {
  requiredSignersCount: number;
  requestedSymbolsCount: number;
  dataPointsCount: number;
}

interface GasReport {
  forAttachingDataToCalldata: number | string;
  forDataExtractionAndVerification: number | string;
  forAttachingDataToCalldataMultiSign: number | string;
  forDataExtractionAndVerificationMultiSign: number | string;
}

// Change this array to configure your custom benchmark test cases
const TEST_CASES = {
  requiredSignersCount: [1, 3, 10],
  requestedSymbolsCount: [1, 2, 10, 20],
  dataPointsCount: [1, 2, 10, 20],
};

describe("Benchmark", function () {
  let singleSignContract: Benchmark;
  let multiSignContract: Benchmark;
  const fullGasReport: any = {};

  this.beforeEach(async () => {
    const BenchmarkFactory = await ethers.getContractFactory("Benchmark");
    singleSignContract = await BenchmarkFactory.deploy();
    await singleSignContract.deployed();

    const MultiSignBenchmarkFactory = await ethers.getContractFactory(
      "Benchmark"
    );
    multiSignContract = await MultiSignBenchmarkFactory.deploy();
    await multiSignContract.deployed();
  });

  this.afterAll(async () => {
    console.log("=== FINAL GAS REPORT ===");
    console.log(JSON.stringify(fullGasReport, null, 2));
  });

  const prepareMockMultiSignDataPackageConfig = (
    benchmarkParams: BenchmarkTestCaseParams
  ): MockMultiSignDataPackageConfig => {
    const dataPoints = [
      ...Array(benchmarkParams.requestedSymbolsCount).keys(),
    ].map(
      (i) =>
        new NumericDataPoint({
          dataFeedId: `TEST-${i}`,
          value: 42 + i,
        })
    );
    const mockDataPackage: MockMultiSignDataPackageConfig = {
      dataPackage: new DataPackage(dataPoints, DEFAULT_TIMESTAMP_FOR_TESTS),
      signers: MOCK_SIGNERS.slice(0, benchmarkParams.requiredSignersCount).map(
        (signer) => signer.address as MockSignerAddress
      ),
    };

    return mockDataPackage;
  };
  const prepareMockDataPackageConfig = (
    benchmarkParams: BenchmarkTestCaseParams
  ): MockDataPackageConfig[] => {
    if (
      benchmarkParams.dataPointsCount < benchmarkParams.requestedSymbolsCount
    ) {
      return prepareMockDataPackageConfigWithSingleDataPointPackages(
        benchmarkParams
      );
    } else {
      return prepareMockDataPackageConfigWithManyDataPointPackages(
        benchmarkParams
      );
    }
  };

  const prepareMockDataPackageConfigWithSingleDataPointPackages = (
    benchmarkParams: BenchmarkTestCaseParams
  ) => {
    // Prepare many data packages (for each requested symbol there are many data packages with each signer)
    const mockDataPackages: MockDataPackageConfig[] = [];
    for (
      let requestedSymbolIndex = 0;
      requestedSymbolIndex < benchmarkParams.requestedSymbolsCount;
      requestedSymbolIndex++
    ) {
      for (
        let signerIndex = 0;
        signerIndex < benchmarkParams.requiredSignersCount;
        signerIndex++
      ) {
        const dataPoints = [
          new NumericDataPoint({
            dataFeedId: `TEST-${requestedSymbolIndex}`,
            value: 42 + requestedSymbolIndex,
          }),
        ];
        mockDataPackages.push({
          dataPackage: new DataPackage(dataPoints, DEFAULT_TIMESTAMP_FOR_TESTS),
          signer: MOCK_SIGNERS[signerIndex].address as MockSignerAddress,
        });
      }
    }

    return mockDataPackages;
  };

  const prepareMockDataPackageConfigWithManyDataPointPackages = (
    benchmarkParams: BenchmarkTestCaseParams
  ) => {
    // Prepare data package for each signer (each data package has benchmarkParams.dataPointsCount data points)
    const dataPoints = [...Array(benchmarkParams.dataPointsCount).keys()].map(
      (i) =>
        new NumericDataPoint({
          dataFeedId: `TEST-${i}`,
          value: 42 + i,
        })
    );
    const mockDataPackages: MockDataPackageConfig[] = [
      ...Array(benchmarkParams.requiredSignersCount).keys(),
    ].map((i) => ({
      dataPackage: new DataPackage(dataPoints, DEFAULT_TIMESTAMP_FOR_TESTS),
      signer: MOCK_SIGNERS[i].address as MockSignerAddress,
    }));

    return mockDataPackages;
  };

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
    return (
      benchmarkParams.requiredSignersCount +
      " signers, " +
      benchmarkParams.requestedSymbolsCount +
      " symbols, " +
      benchmarkParams.dataPointsCount +
      " points"
    );
  };

  const runBenchmarkTestCase = async (
    benchmarkParams: BenchmarkTestCaseParams
  ) => {
    const shortTitle = getBenchmarkCaseShortTitle(benchmarkParams);

    console.log(`Benchmark case testing started: ${shortTitle}`);

    const dataFeedIds = [
      ...Array(benchmarkParams.requestedSymbolsCount).keys(),
    ].map((i) => `TEST-${i}`);
    const bytes32Symbols = dataFeedIds.map(utils.convertStringToBytes32);
    const mockDataPackagesConfig =
      prepareMockDataPackageConfig(benchmarkParams);

    const mockMultiSingDataPackagesConfig =
      prepareMockMultiSignDataPackageConfig(benchmarkParams);

    


    const wrappedSingleSignContract = WrapperBuilder.wrap(
      singleSignContract
    ).usingMockDataPackages(mockDataPackagesConfig);

    const wrappedMultiSignContract = WrapperBuilder.wrap(
      multiSignContract
    ).usingMockMultiSignDataPackage(
      mockMultiSingDataPackagesConfig
    );



    // Updating unique signers count in contract
    const uniqueSignersThresholdUpdateTx =
      await singleSignContract.updateUniqueSignersThreshold(
        benchmarkParams.requiredSignersCount
      );
    await uniqueSignersThresholdUpdateTx.wait();

    // Test empty function without wrapping
    const emptyTxWithoutWrapping =
      await singleSignContract.emptyExtractOracleValues(bytes32Symbols);
    const emptyTxWithoutWrappingReceipt = await emptyTxWithoutWrapping.wait();

    // Test empty function with wrapping
    const emptyTxWithWrapping = await wrappedSingleSignContract.emptyExtractOracleValues(
      bytes32Symbols
    );
    const emptyTxWithWrappingReceipt = await emptyTxWithWrapping.wait();
    
    // Test empty function without wrapping multi sign
    const emptyTxWithoutWrappingMultiSign =
      await multiSignContract.emptyExtractOracleValues(bytes32Symbols);
    const emptyTxWithoutWrappingMultiSignReceipt = await emptyTxWithoutWrappingMultiSign.wait();

    // Test empty function with wrapping multi sign
    const emptyTxWithWrappingMultiSign = await wrappedMultiSignContract.emptyExtractOracleValues(
      bytes32Symbols
    );
    const emptyTxWithWrappingMultiSignReceipt = await emptyTxWithWrappingMultiSign.wait();

    try {
      // Test non-empty function with wrapping
      const realOracleTx = await wrappedSingleSignContract.extractOracleValues(
        bytes32Symbols
      );
      const realOracleTxReceipt = await realOracleTx.wait();

      const realOracleTxMultiSign = await wrappedMultiSignContract.extractOracleValues(
        bytes32Symbols
      );
      const realOracleTxMultiSignReceipt = await realOracleTxMultiSign.wait();


      const gasReport: GasReport = {
        forAttachingDataToCalldata: emptyTxWithWrappingReceipt.gasUsed
          .sub(emptyTxWithoutWrappingReceipt.gasUsed)
          .toNumber(),
        forDataExtractionAndVerification: realOracleTxReceipt.gasUsed
          .sub(emptyTxWithWrappingReceipt.gasUsed)
          .toNumber(),
        forAttachingDataToCalldataMultiSign: emptyTxWithWrappingMultiSignReceipt.gasUsed
          .sub(emptyTxWithoutWrappingMultiSignReceipt.gasUsed)
          .toNumber(),
        forDataExtractionAndVerificationMultiSign: realOracleTxMultiSignReceipt.gasUsed
          .sub(emptyTxWithWrappingMultiSignReceipt.gasUsed)
          .toNumber(),
      };

      console.log({ gasReport });

      updateFullGasReport(benchmarkParams, gasReport);
    } catch (e) {
      console.log("Most probably gas ran out of gas");
      console.error(e);
      updateFullGasReport(benchmarkParams, {
        forAttachingDataToCalldata: "error-too-much-gas",
        forDataExtractionAndVerification: "error-too-much-gas",
        forAttachingDataToCalldataMultiSign: "error-too-much-gas",
        forDataExtractionAndVerificationMultiSign: "error-too-much-gas",
      });
    }
  };

  for (const requiredSignersCount of TEST_CASES.requiredSignersCount) {
    for (const requestedSymbolsCount of TEST_CASES.requestedSymbolsCount) {
      for (const dataPointsCount of TEST_CASES.dataPointsCount) {
        if (dataPointsCount >= requestedSymbolsCount || dataPointsCount == 1) {
          const benchmarkParams: BenchmarkTestCaseParams = {
            requiredSignersCount,
            requestedSymbolsCount,
            dataPointsCount,
          };
          it(`Benchmark: ${getBenchmarkCaseShortTitle(
            benchmarkParams
          )}`, async () => {
            await runBenchmarkTestCase(benchmarkParams);
          });
        }
      }
    }
  }
});
