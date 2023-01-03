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
import { SampleStorageProxy, SampleProxyConnector } from "../typechain-types";

interface BenchmarkTestCaseParams {
  requiredSignersCount: number;
  requestedSymbolsCount: number;
  dataPointsCount: number;
}

interface GasReport {
  storageProxy: number | string;
  proxyConnector: number | string;
}

// Change this array to configure your custom benchmark test cases
const TEST_CASES = {
  requiredSignersCount: [10],
  requestedSymbolsCount: [1, 2, 10, 20],
  dataPointsCount: [1],
};

describe("Benchmark", function () {
  let storageProxy: SampleStorageProxy;
  let proxyConnector: SampleProxyConnector;

  const fullGasReport: any = {};

  this.beforeEach(async () => {
    const StorageProxyFactory = await ethers.getContractFactory(
      "SampleStorageProxy"
    );
    const ProxyConnectorFactory = await ethers.getContractFactory(
      "SampleProxyConnector"
    );

    storageProxy = await StorageProxyFactory.deploy();
    await storageProxy.deployed();

    proxyConnector = await ProxyConnectorFactory.deploy();
    await proxyConnector.deployed();
  });

  this.afterAll(async () => {
    console.log("=== FINAL GAS REPORT ===");
    console.log(JSON.stringify(fullGasReport, null, 2));
  });

  const prepareMockDataPackageConfig = (
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

  const updateFullGasReport = (
    benchmarkParams: BenchmarkTestCaseParams,
    gasReport: GasReport
  ) => {
    const becnhmarkCaseKey = getBenchmarkCaseShortTitle(benchmarkParams);
    fullGasReport[becnhmarkCaseKey] = gasReport;
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

    const wrappedStorageProxy = WrapperBuilder.wrap(
      storageProxy
    ).usingMockDataPackages(mockDataPackagesConfig);
    const wrappedProxyConnector = WrapperBuilder.wrap(
      proxyConnector
    ).usingMockDataPackages(mockDataPackagesConfig);

    try {
      let storageProxyGas = 0;
      let proxyConnectorGas = 0;

      for (const dataFeedId of bytes32Symbols) {
        const emptyWrappedProxyConnectorTx =
          await wrappedProxyConnector.emptyGetOracleValueBenchmark(dataFeedId);
        const emptyWrappedProxyConnectorTxReceipt =
          await emptyWrappedProxyConnectorTx.wait();

        const wrappedProxyConnectorTx =
          await wrappedProxyConnector.getOracleValueBenchmark(dataFeedId);
        const wrappedProxyConnectorTxReceipt =
          await wrappedProxyConnectorTx.wait();
        const emptyWrappedStorageProxyTx =
          await wrappedStorageProxy.emptyGetOracleValueBenchmark(dataFeedId);
        const emptyWrappedStorageProxyTxReceipt =
          await emptyWrappedStorageProxyTx.wait();

        const wrappedStorageProxyTx =
          await wrappedStorageProxy.getOracleValueBenchmark(dataFeedId);
        const wrappedStorageProxyTxReceipt = await wrappedStorageProxyTx.wait();

        storageProxyGas += wrappedStorageProxyTxReceipt.gasUsed
          .sub(emptyWrappedStorageProxyTxReceipt.gasUsed)
          .toNumber();
        proxyConnectorGas += wrappedProxyConnectorTxReceipt.gasUsed
          .sub(emptyWrappedProxyConnectorTxReceipt.gasUsed)
          .toNumber();
      }

      const gasReport: GasReport = {
        storageProxy: storageProxyGas,
        proxyConnector: proxyConnectorGas,
      };

      console.log({ gasReport });

      updateFullGasReport(benchmarkParams, gasReport);
    } catch (e) {
      console.log("Most probably gas ran out of gas");
      console.error(e);
      updateFullGasReport(benchmarkParams, {
        storageProxy: "error-too-much-gas",
        proxyConnector: "error-too-much-gas",
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
