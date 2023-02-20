import { ethers } from "ethers";
import { config } from "../../../config";

const ARBITRUM_NETWORK_NAME = "Arbitrum One";
const ARBITRUM_CHAIN_ID = 42161;

const arbitrumNetworkConfig = {
  name: ARBITRUM_NETWORK_NAME,
  chainId: ARBITRUM_CHAIN_ID,
};

export const arbitrumProvider = new ethers.providers.StaticJsonRpcProvider(
  config.arbitrumRpcUrl,
  arbitrumNetworkConfig
);
