import { config } from "../config";
import { produceProvider } from "./providers";

const ethereumNetworkConfig = {
  name: "Ethereum Mainnet",
  chainId: 1,
};
export const ethereumProvider = produceProvider(
  config.ethMainRpcUrls,
  ethereumNetworkConfig
);

const arbitrumNetworkConfig = {
  name: "Arbitrum One",
  chainId: 42161,
};
export const arbitrumProvider = produceProvider(
  config.arbitrumRpcUrls,
  arbitrumNetworkConfig
);

const avalancheNetworkConfig = {
  name: "Avalanche Network",
  chainId: 43114,
};

export const avalancheProvider = produceProvider(
  config.avalancheRpcUrls,
  avalancheNetworkConfig
);
