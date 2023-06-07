import GmdAbi from "./GmdToken.abi.json";
import GmdVaultAbi from "./GmdVault.abi.json";

export const gmdTokensContractsDetails = {
  abi: GmdAbi,
  vaultAbi: GmdVaultAbi,
  vaultAddress: "0x5517c5F22177BcF7b320A2A5daF2334344eFb38C",
  contractDetails: {
    gmdUSDC: {
      address: "0x33f0a866d9024d44de2E0602f4C9B94755944B6F",
      tokenToFetch: "USDC",
      poolInfoArg: 0,
    },
    gmdAVAX: {
      address: "0x13AF25f924056d4D4668705C33aB9b70D505050e",
      tokenToFetch: "AVAX",
      poolInfoArg: 1,
    },
    gmdBTC: {
      address: "0x8fe3024351B9a51a3439183e940c2aF3994DD52F",
      tokenToFetch: "BTC",
      poolInfoArg: 2,
    },
    gmdETH: {
      address: "0xE28c95e9EB0f6D16b05D265cAa4BcEE9E5C2e625",
      tokenToFetch: "ETH",
      poolInfoArg: 3,
    },
  },
};
