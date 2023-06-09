import SteakHutLBVaultAbi from "./SteakHutLBVault.abi.json";

export const steakHutTokensContractDetails = {
  "SHLB_AVAX-USDC_B": {
    address: "0x668530302c6ecc4ebe693ec877b79300ac72527c",
    abi: SteakHutLBVaultAbi,
    tokensToFetch: ["AVAX", "USDC"],
  },
  "SHLB_BTC.b-AVAX_B": {
    address: "0x536d7e7423e8fb799549caf574cfa12aae95ffcd",
    abi: SteakHutLBVaultAbi,
    tokensToFetch: ["BTC", "AVAX"],
  },
  "SHLB_USDT.e-USDt_C": {
    address: "0x9f44e67ba256c18411bb041375e572e3dd11fa72",
    abi: SteakHutLBVaultAbi,
    tokensToFetch: ["USDT.e", "USDT"],
  },
  "SHLB_JOE-AVAX_B": {
    address: "0x89547441489262fEb5cEE346fdacb9037C2574Db",
    abi: SteakHutLBVaultAbi,
    tokensToFetch: ["JOE", "AVAX"],
  },
};
