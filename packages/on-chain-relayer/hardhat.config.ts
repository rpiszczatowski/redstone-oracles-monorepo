import * as dotenv from "dotenv";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-gas-reporter";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : undefined;

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  gasReporter: {
    enabled: true,
    currency: "USD",
  },
  networks: {
    "arbitrum-goerli": {
      url: "https://arbitrum-goerli.public.blastapi.io",
      accounts,
    },
    arbitrum: {
      url: "https://arb1.croswap.com/rpc",
      accounts,
    },
    ethereum: {
      url: "https://eth-mainnet.public.blastapi.io",
      accounts,
    },
    "ethereum-goerli": {
      url: "https://eth-goerli.public.blastapi.io",
      accounts,
    },
    "zk-evm-testnet": {
      url: "https://rpc.public.zkevm-test.net",
      accounts,
    }
  },
};

export default config;
