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
  storageProxyOneAsset: number | string;
  proxyConnectorOneAsset: number | string;
  storageProxyManyAssets: number | string;
  proxyConnectorManyAssets: number | string;
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

    const wrappedStorageProxy = WrapperBuilder.wrap(
      storageProxy
    ).usingMockDataPackages(mockDataPackagesConfig);
    const wrappedProxyConnector = WrapperBuilder.wrap(
      proxyConnector
    ).usingMockDataPackages(mockDataPackagesConfig);

    // Run benchmarks
    try {
      // Get value of one assets
      const emptyWrappedProxyConnectorOneAssetTx =
        await wrappedProxyConnector.emptyGetOracleValueBenchmark(
          bytes32Symbols[0]
        );
      const emptyWrappedProxyConnectorOneAssetTxReceipt =
        await emptyWrappedProxyConnectorOneAssetTx.wait();

      const wrappedProxyConnectorOneAssetTx =
        await wrappedProxyConnector.getOracleValueBenchmark(bytes32Symbols[0]);
      const wrappedProxyConnectorOneAssetTxReceipt =
        await wrappedProxyConnectorOneAssetTx.wait();

      const emptyWrappedStorageProxyOneAssetTx =
        await wrappedStorageProxy.emptyGetOracleValueBenchmark(
          bytes32Symbols[0]
        );
      const emptyWrappedStorageProxyOneAssetTxReceipt =
        await emptyWrappedStorageProxyOneAssetTx.wait();

      const wrappedStorageProxyOneAssetTx =
        await wrappedStorageProxy.getOracleValueBenchmark(bytes32Symbols[0]);
      const wrappedStorageProxyOneAssetTxReceipt =
        await wrappedStorageProxyOneAssetTx.wait();

      // Get value of many assets
      const emptyWrappedProxyConnectorManyAssetsTx =
        await wrappedProxyConnector.emptyGetOracleValuesBenchmark(
          bytes32Symbols
        );
      const emptyWrappedProxyConnectorManyAssetsTxReceipt =
        await emptyWrappedProxyConnectorManyAssetsTx.wait();

      const wrappedProxyConnectorManyAssetsTx =
        await wrappedProxyConnector.getOracleValuesBenchmark(bytes32Symbols);
      const wrappedProxyConnectorManyAssetsTxReceipt =
        await wrappedProxyConnectorManyAssetsTx.wait();

      const emptyWrappedStorageProxyManyAssetsTx =
        await wrappedStorageProxy.emptyGetOracleValuesBenchmark(bytes32Symbols);
      const emptyWrappedStorageProxyManyAssetsTxReceipt =
        await emptyWrappedStorageProxyManyAssetsTx.wait();

      const wrappedStorageProxyManyAssetsTx =
        await wrappedStorageProxy.getOracleValuesBenchmark(bytes32Symbols);
      const wrappedStorageProxyManyAssetsTxReceipt =
        await wrappedStorageProxyManyAssetsTx.wait();

      const gasReport: GasReport = {
        proxyConnectorOneAsset: wrappedProxyConnectorOneAssetTxReceipt.gasUsed
          .sub(emptyWrappedProxyConnectorOneAssetTxReceipt.gasUsed)
          .toNumber(),
        storageProxyOneAsset: wrappedStorageProxyOneAssetTxReceipt.gasUsed
          .sub(emptyWrappedStorageProxyOneAssetTxReceipt.gasUsed)
          .toNumber(),
        proxyConnectorManyAssets:
          wrappedProxyConnectorManyAssetsTxReceipt.gasUsed
            .sub(emptyWrappedProxyConnectorManyAssetsTxReceipt.gasUsed)
            .toNumber(),
        storageProxyManyAssets: wrappedStorageProxyManyAssetsTxReceipt.gasUsed
          .sub(emptyWrappedStorageProxyManyAssetsTxReceipt.gasUsed)
          .toNumber(),
      };

      console.log({ gasReport });

      updateFullGasReport(benchmarkParams, gasReport);
    } catch (e) {
      console.log("Most probably gas ran out of gas");
      console.error(e);
      updateFullGasReport(benchmarkParams, {
        proxyConnectorOneAsset: "error-too-much-gas",
        storageProxyOneAsset: "error-too-much-gas",
        proxyConnectorManyAssets: "error-too-much-gas",
        storageProxyManyAssets: "error-too-much-gas",
      });
    }
  };

  for (const requiredSignersCount of TEST_CASES.requiredSignersCount) {
    for (const requestedSymbolsCount of TEST_CASES.requestedSymbolsCount) {
      const dataPointsCount = 1;
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
});
