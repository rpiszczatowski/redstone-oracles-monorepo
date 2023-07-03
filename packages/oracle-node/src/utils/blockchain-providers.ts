import { providers } from "ethers";
import { config } from "../config";
import { ProviderWithAgreement } from "redstone-rpc-providers";

const produceProvider = (
  rpcUrls: string[],
  network: { name: string; chainId: number }
): providers.Provider => {
  if (rpcUrls.length === 1) {
    return new providers.StaticJsonRpcProvider(rpcUrls[0], network);
  } else if (rpcUrls.length > 1) {
    const rpcProviders = rpcUrls.map(
      (rpcUrl) => new providers.StaticJsonRpcProvider(rpcUrl, network)
    );
    return new ProviderWithAgreement(rpcProviders);
  }
  throw new Error(
    `At least one rpc url has to be specified for network ${network.name}`
  );
};
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

const optimismNetworkConfig = {
  name: "Optimism",
  chainId: 10,
};

export const optimismProvider = produceProvider(
  config.optimismRpcUrls,
  optimismNetworkConfig
);
