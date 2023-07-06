import { providers } from "ethers";
import { ProviderWithAgreement } from "redstone-rpc-providers";

export const produceProvider = (
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
