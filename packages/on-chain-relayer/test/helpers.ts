import { Contract, Signer } from "ethers";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { NumericDataPoint, DataPackage } from "redstone-protocol";
import { DataPackagesResponse } from "redstone-sdk";
import { formatBytes32String } from "ethers/lib/utils";
import { config } from "../src/config";

export const ethDataFeed = formatBytes32String("ETH");
export const btcDataFeed = formatBytes32String("BTC");

interface DataPoint {
  dataFeedId: string;
  value: number;
}

export const dataFeedsIds = [ethDataFeed, btcDataFeed];

export const getWrappedContractAndUpdateBlockTimestamp = async (
  contract: Contract,
  timestamp: number,
  newDataPoint?: DataPoint
) => {
  const dataPoints = [
    { dataFeedId: "ETH", value: 1670.99 },
    { dataFeedId: "BTC", value: 23077.68 },
  ];
  if (newDataPoint) {
    dataPoints.push(newDataPoint);
  }
  const blockTimestamp = await time.latest();
  await time.setNextBlockTimestamp(blockTimestamp + 10);
  return WrapperBuilder.wrap(contract).usingSimpleNumericMock({
    mockSignersCount: 2,
    dataPoints,
    timestampMilliseconds: timestamp,
  });
};

export const mockEnvVariables = (overrideMockConfig: any = {}) => {
  (config as any) = {
    relayerIterationInterval: "10",
    updatePriceInterval: "1000",
    rpcUrl: "http://127.0.0.1:8545",
    chainName: "HardhatNetwork",
    chainId: "31337",
    privateKey:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // well-known private key for the first hardhat account
    adapterContractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    dataServiceId: "redstone-main-demo",
    uniqueSignersCount: "2",
    dataFeeds: ["ETH", "BTC"],
    cacheServiceUrls: ["http://mock-cache-service"],
    gasLimit: 1000000,
    updateConditions: ["time", "value-deviation"],
    minDeviationPercentage: 10,
    adapterContractType: "price-feeds",
    ...overrideMockConfig,
  };
};

type DataPointsKeys = "ETH" | "BTC";

const mockWallets = [
  {
    privateKey:
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  },
  {
    privateKey:
      "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  },
];

export const getDataPackagesResponse = async () => {
  const timestampMilliseconds = (await time.latest()) * 1000;

  const dataPoints = [
    { dataFeedId: "ETH", value: 1670.99 },
    { dataFeedId: "BTC", value: 23077.68 },
  ];

  const signedDataPackages: DataPackagesResponse = {
    ETH: [],
    BTC: [],
  };

  for (const mockWallet of mockWallets) {
    for (const dataPointObj of dataPoints) {
      const dataPoint = new NumericDataPoint(dataPointObj);
      const mockDataPackage = {
        signer: mockWallet.address,
        dataPackage: new DataPackage([dataPoint], timestampMilliseconds),
      };
      const privateKey = mockWallet.privateKey;
      const signedDataPackage = mockDataPackage.dataPackage.sign(privateKey);
      signedDataPackages[dataPointObj.dataFeedId as DataPointsKeys].push(
        signedDataPackage
      );
    }
  }
  return signedDataPackages;
};

export const deployMockSortedOracles = async (signer?: Signer) => {
  // Deploying AddressSortedLinkedListWithMedian library
  const AddressSortedLinkedListWithMedianFactory =
    await ethers.getContractFactory(
      "AddressSortedLinkedListWithMedian",
      signer
    );
  const sortedLinkedListContract =
    await AddressSortedLinkedListWithMedianFactory.deploy();
  await sortedLinkedListContract.deployed();

  // Deploying MockSortedOracles contract
  const MockSortedOraclesFactory = await ethers.getContractFactory(
    "MockSortedOracles",
    {
      libraries: {
        AddressSortedLinkedListWithMedian: sortedLinkedListContract.address,
      },
      signer,
    }
  );
  const contract = await MockSortedOraclesFactory.deploy();
  await contract.deployed();
  return contract;
};

const sofraiResponse = {
  effectiveDate: "2023-05-15",
  type: "SOFRAI",
  average30day: 4.90571,
  average90day: 4.76228,
  average180day: 4.50452,
  index: 1.07829396,
  revisionIndicator: "",
};

const sofrResponse = {
  effectiveDate: "2023-05-12",
  type: "SOFR",
  percentRate: 5.05,
  percentPercentile1: 4.98,
  percentPercentile25: 5.04,
  percentPercentile75: 5.09,
  percentPercentile99: 5.14,
  volumeInBillions: 1352,
  revisionIndicator: "",
};

export const mockNewYorkFedResponse = {
  refRates: [sofraiResponse, sofrResponse],
};

export const differentMockNewYorkFedResponse = {
  refRates: [
    { ...sofraiResponse, index: 1.07829434 },
    { ...sofrResponse, percentRate: 5.06 },
  ],
};
