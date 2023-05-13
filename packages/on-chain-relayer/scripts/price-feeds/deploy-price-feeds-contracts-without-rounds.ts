import { utils } from "ethers";
import { ethers } from "hardhat";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { requestDataPackages } from "redstone-sdk";
import { config } from "../../src/config";

// Usage: yarn run-script src/scripts/price-feeds/deploy-price-feeds-contracts.ts
// Note! You should configure the .env file properly before running this script

(async () => {
  const dataFeeds = config.dataFeeds as string[];

  console.log("Deploying adapter contract...");
  const adapterFactory = await ethers.getContractFactory(
    "VoltzPriceFeedsAdapter"
  );
  const adapterContract = await adapterFactory.deploy();
  await adapterContract.deployed();
  console.log(`Adapter contract deployed - ${adapterContract.address}`);

  console.log("Deploying price feeds contracts...");
  const sofrPriceFeedFactory = await ethers.getContractFactory(
    "VoltzSofrPriceFeed"
  );
  const sofrPriceFeedContract = await sofrPriceFeedFactory.deploy();
  await sofrPriceFeedContract.deployed();
  await sofrPriceFeedContract.setAdapterAddress(adapterContract.address);
  console.log(
    `Price feed contract for SOFR deployed - ${sofrPriceFeedContract.address}`
  );
  const sofraiPriceFeedFactory = await ethers.getContractFactory(
    "VoltzSofraiPriceFeed"
  );
  const sofraiPriceFeedContract = await sofraiPriceFeedFactory.deploy();
  await sofraiPriceFeedContract.deployed();
  await sofraiPriceFeedContract.setAdapterAddress(adapterContract.address);
  console.log(
    `Price feed contract for SOFRAI deployed - ${sofraiPriceFeedContract.address}`
  );

  console.log("Updating data feeds values...");
  const { dataServiceId, uniqueSignersCount, cacheServiceUrls, gasLimit } =
    config;
  const dataPackages = await requestDataPackages(
    {
      dataServiceId,
      uniqueSignersCount,
      dataFeeds,
    },
    cacheServiceUrls
  );

  if (adapterContract) {
    const wrappedContract =
      WrapperBuilder.wrap(adapterContract).usingDataPackages(dataPackages);

    const dataPackageTimestamp =
      dataPackages[dataFeeds[0]][0].dataPackage.timestampMilliseconds;

    const updateTransaction = await wrappedContract.updateDataFeedsValues(
      dataPackageTimestamp,
      { gasLimit }
    );
    await updateTransaction.wait();
    console.log("Successfully updated prices");
  } else {
    console.error("Price manager contract not deployed");
  }
})();
