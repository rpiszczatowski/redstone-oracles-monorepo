import { JsonRpcProvider } from "@ethersproject/providers";
import { providers, Wallet } from "ethers";
import { config } from "../../config";

export const getProvider = (providerIndex = 0) => {
  const { rpcUrls, chainName, chainId } = config;

  if (!rpcUrls[providerIndex]) {
    throw new Error(`No provider with index ${providerIndex}.`);
  }

  return new providers.StaticJsonRpcProvider(rpcUrls[providerIndex], {
    name: chainName,
    chainId: Number(chainId),
  });
};

export const getSigner = (overrideProvider?: JsonRpcProvider) => {
  const provider = overrideProvider ? overrideProvider : getProvider();
  const signer = new Wallet(config.privateKey, provider);
  return signer;
};
