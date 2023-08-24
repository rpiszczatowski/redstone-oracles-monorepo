import BalancerComposableStablePoolAbi from "./ComposableStablePool.abi.json";
import BalancerERC4626LinearPoolAbi from "./BalancerERC4626LinearPool.json";

export const balancerTokensContractDetails = {
  "sAVAX-bb-a-WAVAX-BPT": {
    mainPoolAddress: "0xA154009870E9B6431305F19b09F9cfD7284d4E7A",
    mainPoolAbi: BalancerComposableStablePoolAbi,
    secondPoolAddress: "0x7275c131b1f67e8b53b4691f92b0e35a4c1c6e22",
    secondPoolAbi: BalancerERC4626LinearPoolAbi,
    tokensToFetch: ["sAVAX", "AVAX"],
    tokenDecimals: 18,
  },
};
