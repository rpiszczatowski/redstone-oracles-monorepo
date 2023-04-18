import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { ethers } from "hardhat";

const SLEEP_TIME_MS = 3000;

const contractNames = [
  "PriceFeedsAdapterWithRoundsMock",
  "PriceFeedsAdapterWithoutRoundsMock",
  "SinglePriceFeedAdapterMock",
  "SinglePriceFeedAdapterWithClearingMock",
];

main();

async function main() {
  for (const contractName of contractNames) {
    console.log(`\n=== Benchmarking contract: ${contractName} ===`);
    await benchmarkContract(contractName);
  }
}

async function benchmarkContract(contractName: string) {
  const contract = await deployContract(contractName);

  for (let i = 1; i <= 3; i++) {
    const btcMockValue = i * 100;
    const mockDataTimestamp = Date.now();

    // Wrapping contract with Redstone payload
    const wrappedContract = await WrapperBuilder.wrap(contract).usingSimpleNumericMock({
      mockSignersCount: 2,
      timestampMilliseconds: mockDataTimestamp,
      dataPoints: [{ dataFeedId: "BTC", value: btcMockValue }],
    }) as IRedstoneAdapter;

    // Evaluating gas costs
    console.log(`Running test iteration nr: ${i}...`);
    const tx = await wrappedContract.updateDataFeedsValues(mockDataTimestamp);
    console.log(`Transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Gas used: ${receipt.cumulativeGasUsed}`);

    console.log(`Sleeping for ${SLEEP_TIME_MS} ms...`);
    await sleep(SLEEP_TIME_MS);
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deployContract(contractName: string) {
  const factory = await ethers.getContractFactory(contractName);

  // Deploy the contract
  console.log("Deploying contract: " + contractName);
  const contract = await factory.deploy();
  console.log("Contract deployed to: " + contract.address);

  return contract;
}
