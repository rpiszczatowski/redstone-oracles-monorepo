import BalancerPoolAbi from "./BalancerERC4626LinearPool.abi.json";
import BalancerVaultAbi from "./BalancerVault.abi.json";

export const balancerTokensContractDetails = {
  "BB-A-WETH": {
    address: "0x60d604890feaa0b5460b28a424407c24fe89374a",
    abi: BalancerPoolAbi,
    vaultAddress: "0xBA12222222228d8Ba445958a75a0704d566BF2C8",
    vaultAbi: BalancerVaultAbi,
    tokenToFetch: "ETH",
    poolId:
      "0x60d604890feaa0b5460b28a424407c24fe89374a0000000000000000000004fc",
  },
};
