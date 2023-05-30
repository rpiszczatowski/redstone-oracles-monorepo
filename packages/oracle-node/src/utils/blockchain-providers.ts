import { providers } from "ethers";
import { config } from "../config";

export const ethereumProvider = new providers.StaticJsonRpcProvider(
  config.ethMainRpcUrl,
  {
    name: "Ethereum Mainnet",
    chainId: 1,
  }
);

export const arbitrumProvider = new providers.StaticJsonRpcProvider(
  config.arbitrumRpcUrl,
  {
    name: "Arbitrum One",
    chainId: 42161,
  }
);

const avalancheNetworkConfig = {
  name: "Avalanche Network",
  chainId: 43114,
};

export const avalancheProvider = new providers.StaticJsonRpcProvider(
  config.avalancheRpcUrl,
  avalancheNetworkConfig
);

export const fallbackProvider = new providers.StaticJsonRpcProvider(
  config.fallbackAvalancheRpcUrl,
  avalancheNetworkConfig
);
