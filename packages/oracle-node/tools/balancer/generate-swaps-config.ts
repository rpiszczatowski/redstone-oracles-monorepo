import {
  BalancerSDK,
  Network,
  PoolFilter,
  SwapInfo,
  SwapOptions,
  SwapTypes,
  parseFixed,
} from "@balancer-labs/sdk";
import { BigNumber } from "ethers";

(async () => {
  const balancer = new BalancerSDK({
    network: Network.MAINNET,
    rpcUrl: "https://rpc.ankr.com/eth",
  });

  const tokenIn = "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f"; // GHO
  const tokenOut = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI

  const exp = 21;
  const amount = parseFixed("1", exp);

  await balancer.sor.fetchPools();

  const timestampSeconds = Math.floor(Date.now() / 1000);

  const swapOptions: SwapOptions = {
    maxPools: 2,
    gasPrice: BigNumber.from("1000000000"),
    swapGas: BigNumber.from("1000000000"),
    forceRefresh: false,
    timestamp: timestampSeconds,
    poolTypeFilter: PoolFilter.All,
  };

  const swapInfoV2: SwapInfo = await balancer.sor.getSwaps(
    tokenIn,
    tokenOut,
    SwapTypes.SwapExactIn,
    amount,
    swapOptions
  );

  console.log(swapInfoV2);
})();
