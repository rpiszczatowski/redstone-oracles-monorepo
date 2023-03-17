import { deployMockSortedOracles } from "../../custom-integrations/mento/mento-utils";
import { ethers } from "hardhat";
import { getProvider } from "../../core/contract-interactions/get-provider";
import { Wallet } from "ethers";
import { config } from "../../config";

// TODO: add requirements for env configuration
// to run this script

const SORTED_ORACLES_ADDRESS = "";

const main = async () => {
  // Maybe deploy SortedOracles contract
  const sortedOraclesAddress = await maybeDeploySortedOracles();
  console.log(`Using sorted oracles address: ${sortedOraclesAddress}`);

  // Deploy MentoAdapter contract
  const mentoAdapter = await deployMentoAdapter(sortedOraclesAddress);
  console.log(`Mento adapter deployed: ${mentoAdapter.address}`);
};

main();

async function maybeDeploySortedOracles() {
  if (SORTED_ORACLES_ADDRESS === "") {
    console.log(`Deploying mock sorted oracles`);
    const sortedOracles = await deployMockSortedOracles(getSigner());
    console.log(`Mock sorted oracles deployed: ${sortedOracles.address}`);
    return sortedOracles.address;
  } else {
    return SORTED_ORACLES_ADDRESS;
  }
}

async function deployMentoAdapter(sortedOraclesAddress: string) {
  const MentoAdapterFactory = await ethers.getContractFactory(
    "MentoAdapter",
    getSigner()
  );
  const mentoAdapter = await MentoAdapterFactory.deploy(sortedOraclesAddress);
  await mentoAdapter.deployed();
  return mentoAdapter;
}

// TODO: move the getSigner function to a seprate module
function getSigner() {
  const provider = getProvider();
  const signer = new Wallet(config.privateKey, provider);
  return signer;
}
