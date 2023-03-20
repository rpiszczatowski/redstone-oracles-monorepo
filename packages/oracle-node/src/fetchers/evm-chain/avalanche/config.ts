import { ethers } from "ethers";
import { config } from "../../../config";

const AVALANCHE_NETWORK_NAME = "Avalanche Network";
const AVALANCHE_CHAIN_ID = 43114;

const avalancheNetworkConfig = {
  name: AVALANCHE_NETWORK_NAME,
  chainId: AVALANCHE_CHAIN_ID,
};

export const avalancheProvider = new ethers.providers.StaticJsonRpcProvider(
  config.avalancheRpcUrl,
  avalancheNetworkConfig
);
