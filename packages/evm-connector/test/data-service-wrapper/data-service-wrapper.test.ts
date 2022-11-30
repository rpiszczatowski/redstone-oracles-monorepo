import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { ethers } from "hardhat";
import { utils } from "redstone-protocol";
import { WrapperBuilder } from "../../src/index";
import { SampleAvalancheDataServiceConsumerBase } from "../../typechain-types";
import { server } from "./mock-server";

chai.use(chaiAsPromised);

describe("DataServiceWrapper", () => {
  let contract: SampleAvalancheDataServiceConsumerBase;

  before(() => server.listen());
  beforeEach(async () => {
    const ContractFactory = await ethers.getContractFactory(
      "SampleAvalancheDataServiceConsumerBase"
    );
    contract = await ContractFactory.deploy();
    await contract.deployed();
  });
  afterEach(() => server.resetHandlers());
  after(() => server.close());

  it("Should properly execute with one valid cache", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingDataService(
      {
        dataServiceId: "redstone-avalanche-prod",
        uniqueSignersCount: 3,
        dataFeeds: ["AVAX", "YAK"],
      },
      ["http://valid-cache.com"]
    );

    const tx = await wrappedContract.save2ValuesInStorage([
      utils.convertStringToBytes32("AVAX"),
      utils.convertStringToBytes32("YAK"),
    ]);
    await tx.wait();

    const firstValueFromContract = await contract.firstValue();
    const secondValueFromContract = await contract.secondValue();

    expect(firstValueFromContract).to.equal(1296717345);
    expect(secondValueFromContract).to.equal(20876143764);
  });

  it("Should properly execute with one valid and one invalid cache", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingDataService(
      {
        dataServiceId: "redstone-avalanche-prod",
        uniqueSignersCount: 3,
        dataFeeds: ["AVAX", "YAK"],
      },
      ["http://valid-cache.com", "http://invalid-cache.com"]
    );

    const tx = await wrappedContract.save2ValuesInStorage([
      utils.convertStringToBytes32("AVAX"),
      utils.convertStringToBytes32("YAK"),
    ]);
    await tx.wait();

    const firstValueFromContract = await contract.firstValue();
    const secondValueFromContract = await contract.secondValue();

    expect(firstValueFromContract).to.equal(1296717345);
    expect(secondValueFromContract).to.equal(20876143764);
  });

  it("Should properly execute with one valid and one slower cache", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingDataService(
      {
        dataServiceId: "redstone-avalanche-prod",
        uniqueSignersCount: 3,
        dataFeeds: ["AVAX", "YAK"],
      },
      ["http://slower-cache.com", "http://valid-cache.com"]
    );

    const tx = await wrappedContract.save2ValuesInStorage([
      utils.convertStringToBytes32("AVAX"),
      utils.convertStringToBytes32("YAK"),
    ]);
    await tx.wait();

    const firstValueFromContract = await contract.firstValue();
    const secondValueFromContract = await contract.secondValue();

    expect(firstValueFromContract).to.equal(1296717345);
    expect(secondValueFromContract).to.equal(20876143764);
  });

  it("Should properly execute with one invalid and one slower cache", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingDataService(
      {
        dataServiceId: "redstone-avalanche-prod",
        uniqueSignersCount: 3,
        dataFeeds: ["AVAX", "YAK"],
      },
      ["http://slower-cache.com", "http://invalid-cache.com"]
    );

    const tx = await wrappedContract.save2ValuesInStorage([
      utils.convertStringToBytes32("AVAX"),
      utils.convertStringToBytes32("YAK"),
    ]);
    await tx.wait();

    const firstValueFromContract = await contract.firstValue();
    const secondValueFromContract = await contract.secondValue();

    expect(firstValueFromContract).to.equal(1296717345);
    expect(secondValueFromContract).to.equal(20876143764);
  });

  it("Should throw error when multiple invalid caches", async () => {
    const wrappedContract = WrapperBuilder.wrap(contract).usingDataService(
      {
        dataServiceId: "redstone-avalanche-prod",
        uniqueSignersCount: 3,
        dataFeeds: ["AVAX", "YAK"],
      },
      ["http://invalid-cache.comhttp://invalid-cache.com"]
    );

    await expect(
      wrappedContract.save2ValuesInStorage([
        utils.convertStringToBytes32("AVAX"),
        utils.convertStringToBytes32("YAK"),
      ])
    ).to.eventually.rejectedWith(
      "All redstone payloads don't pass dry run verification"
    );
  });
});
