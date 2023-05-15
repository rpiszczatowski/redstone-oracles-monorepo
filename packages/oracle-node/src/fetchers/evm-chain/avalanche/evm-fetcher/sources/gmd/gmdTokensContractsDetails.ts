import GmdAbi from "./GmdToken.abi.json";
import GmdVaultAbi from "./GmdVault.abi.json";

export const gmdTokensContractsDetails = {
  gmdUSDC: {
    address: "0x33f0a866d9024d44de2E0602f4C9B94755944B6F",
    abi: GmdAbi,
    tokenToFetch: "USDC",
    poolInfoArg: 0,
    vaultAddress: "0x5517c5F22177BcF7b320A2A5daF2334344eFb38C",
    vaultAbi: GmdVaultAbi,
  },
  gmdAVAX: {
    address: "0x13AF25f924056d4D4668705C33aB9b70D505050e",
    abi: GmdAbi,
    tokenToFetch: "AVAX",
    poolInfoArg: 1,
    vaultAddress: "0x5517c5F22177BcF7b320A2A5daF2334344eFb38C",
    vaultAbi: GmdVaultAbi,
  },
  gmdBTC: {
    address: "0x8fe3024351B9a51a3439183e940c2aF3994DD52F",
    abi: GmdAbi,
    tokenToFetch: "BTC",
    poolInfoArg: 2,
    vaultAddress: "0x5517c5F22177BcF7b320A2A5daF2334344eFb38C",
    vaultAbi: GmdVaultAbi,
  },
  gmdETH: {
    address: "0xE28c95e9EB0f6D16b05D265cAa4BcEE9E5C2e625",
    abi: GmdAbi,
    tokenToFetch: "ETH",
    poolInfoArg: 3,
    vaultAddress: "0x5517c5F22177BcF7b320A2A5daF2334344eFb38C",
    vaultAbi: GmdVaultAbi,
  },
};
