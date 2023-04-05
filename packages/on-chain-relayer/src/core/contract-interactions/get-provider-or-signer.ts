import { providers as Providers, Wallet } from "ethers";
import { ProviderWithFallback } from "redstone-rpc-providers";
import { config } from "../../config";

export const getProvider = () => {
  const { rpcUrls, chainName, chainId } = config;

  const providers = rpcUrls.map(
    (rpcUrl: string) =>
      new Providers.StaticJsonRpcProvider(rpcUrl, {
        name: chainName,
        chainId: Number(chainId),
      })
  );

  if (providers.length === 0) {
    throw new Error("Please provide at least one RPC_URL in RPC_URLS");
  } else if (providers.length === 1) {
    return providers[0];
  } else {
    return new ProviderWithFallback(providers);
  }
};

export const getSigner = () => {
  const signer = new Wallet(config.privateKey, getProvider());
  return signer;
};
