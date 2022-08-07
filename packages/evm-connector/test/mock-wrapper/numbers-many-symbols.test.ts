import { expect } from "chai";
import { ethers } from "hardhat";
import {
  DataPackage,
  INumericDataPoint,
  NumericDataPoint,
  utils,
} from "redstone-protocol";
import {
  MOCK_SIGNERS,
  MockSignerIndex,
  MockSignerAddress,
  DEFAULT_TIMESTAMP_FOR_TESTS,
} from "../../src/helpers/test-utils";
import { WrapperBuilder } from "../../src/index";
import { MockDataPackageConfig } from "../../src/wrappers/MockWrapper";
import { SampleRedstoneConsumerMockManySymbols } from "../../typechain-types";

const NUMBER_OF_MOCK_SIGNERS = 10;

interface MockPackageOpts {
  mockSignerIndex: MockSignerIndex;
  dataPoints: INumericDataPoint[];
  timestampMilliseconds?: number;
}

function getMockPackage(opts: MockPackageOpts): MockDataPackageConfig {
  const timestampMilliseconds =
    opts.timestampMilliseconds || DEFAULT_TIMESTAMP_FOR_TESTS;
  const dataPoints = opts.dataPoints.map((dp) => new NumericDataPoint(dp));
  return {
    signer: MOCK_SIGNERS[opts.mockSignerIndex].address as MockSignerAddress,
    dataPackage: new DataPackage(dataPoints, timestampMilliseconds),
  };
}

// TODO: maybe move `range` function to some utils module
function getRange(start: number, length: number): number[] {
  return [...Array(length).keys()].map((i) => (i += start));
}

describe("SampleRedstoneConsumerMockManySymbols", function () {
  let contract: SampleRedstoneConsumerMockManySymbols;

  const mockDataConfig = [
    getMockPackage({
      mockSignerIndex: 0,
      dataPoints: [
        { dataFeedId: "BTC", value: 412 },
        { dataFeedId: "ETH", value: 41 },
      ],
    }),
    getMockPackage({
      mockSignerIndex: 1,
      dataPoints: [
        { dataFeedId: "BTC", value: 390 },
        { dataFeedId: "ETH", value: 42 },
      ],
    }),
    getMockPackage({
      mockSignerIndex: 2,
      dataPoints: [
        { dataFeedId: "BTC", value: 400 },
        { dataFeedId: "ETH", value: 43 },
      ],
    }),
    ...getRange(3, NUMBER_OF_MOCK_SIGNERS - 3).map((mockSignerIndex: any) =>
      getMockPackage({
        mockSignerIndex,
        dataPoints: [
          { dataFeedId: "BTC", value: 400 },
          { dataFeedId: "ETH", value: 42 },
        ],
      })
    ),
  ];

  this.beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleRedstoneConsumerMockManySymbols"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract (order: ETH, BTC)", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockDataConfig);

    const tx = await wrappedContract.save2ValuesInStorage([
      utils.convertStringToBytes32("ETH"),
      utils.convertStringToBytes32("BTC"),
    ]);
    await tx.wait();

    const ethPriceFromContract = await contract.firstValue();
    const btcPriceFromContract = await contract.secondValue();
    expect(ethPriceFromContract.div(10 ** 8).toNumber()).to.be.equal(42);
    expect(btcPriceFromContract.div(10 ** 8).toNumber()).to.be.equal(400);
  });

  it("Should properly execute transaction on RedstoneConsumerBase contract (order: BTC, ETH)", async () => {
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingMockData(mockDataConfig);

    const tx = await wrappedContract.save2ValuesInStorage([
      utils.convertStringToBytes32("BTC"),
      utils.convertStringToBytes32("ETH"),
    ]);
    await tx.wait();

    const btcPriceFromContract = await contract.firstValue();
    const ethPriceFromContract = await contract.secondValue();
    expect(btcPriceFromContract.div(10 ** 8).toNumber()).to.be.equal(400);
    expect(ethPriceFromContract.div(10 ** 8).toNumber()).to.be.equal(42);
  });

  // TODO: maybe move "should revert" tests to a separate module
  // And include it in almost each test

  // TODO: implement
  it("Should revert for too old timestamp", async () => {
    expect(2 + 2).to.eq(4);
  });

  // TODO: implement
  it("Should revert for unauthorised signers", async () => {
    expect(2 + 2).to.eq(4);
  });

  // TODO: implement
  it("Should revert for insufficient number of signers", async () => {
    expect(2 + 2).to.eq(4);
  });

  // TODO: implement
  it("Should revert for insufficient number of signers", async () => {
    expect(2 + 2).to.eq(4);
  });

  // TODO: implement
  it("Should revert for duplicated packages (not enough unique signers)", async () => {
    expect(2 + 2).to.eq(4);
  });
});
