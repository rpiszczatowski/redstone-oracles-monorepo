import { ethers, upgrades } from "hardhat";

const INITIAL_SUPPLY = 1_000_000_000;
const AUTHORISED_SLASHER = "0x0000000000000000000000000000000000000000";
const DELAY_FOR_UNLOCKING_SECONDS = 30 * 24 * 3600; // 30 days
const VESTING_CONFIG = {
  "0x123": 1_000_000,
  "0x345": 1_000_000,
};

deployAll();

async function deployAll() {
  // TODO: implement addresses saving somewhere (use similar pattern to openzeppelin upgrades)
  console.log("Deploying token contract");
  const tokenAddress = await deployTokenContract();
  console.log(`Token deployed at: ${tokenAddress}`);

  console.log("\nDeploying locking contract");
  const lockingAddress = await deployLockingContract(tokenAddress);
  console.log(`Locking contract deployed at: ${lockingAddress}`);

  console.log("\nDeploying vesting contracts");
  await deployAllVestingContracts();
  console.log("Deployed all vesting contracts");
}

async function deployTokenContract() {
  const TokenContractFactory = await ethers.getContractFactory("RedstoneToken");
  const contract = await TokenContractFactory.deploy();
  await contract.deployed();
  return contract.address;
}

async function deployLockingContract(tokenAddress: string) {
  const LockingRegistryFactory = await ethers.getContractFactory(
    "LockingRegistry"
  );
  const locking = await upgrades.deployProxy(LockingRegistryFactory, [
    tokenAddress,
    AUTHORISED_SLASHER,
    DELAY_FOR_UNLOCKING_SECONDS,
  ]);
  return locking.address;
}

// TODO: implement
async function deployAllVestingContracts() {}
