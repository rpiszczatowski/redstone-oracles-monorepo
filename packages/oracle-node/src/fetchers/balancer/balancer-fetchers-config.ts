import { Network } from "@balancer-labs/sdk";
import { config } from "../../config";

export const balancerFetchersConfig = {
  "balancer-dai": {
    pairedToken: "DAI",
    poolsConfigs: {
      OHM: {
        poolId:
          "0x76fcf0e8c7ff37a47a799fa2cd4c13cde0d981c90002000000000000000003d2",
        tokenIn: "0x6b175474e89094c44da98b954eedeac495271d0f",
        tokenOut: "0x64aa3364f17a4d01c6f1751fd97c2bd3d7e7f1d5",
      },
    },
  },
  "balancer-weth": {
    pairedToken: "ETH",
    poolsConfigs: {
      OHM: {
        poolId:
          "0xd1ec5e215e8148d76f4460e4097fd3d5ae0a35580002000000000000000003d3",
        tokenIn: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        tokenOut: "0x64aa3364f17a4d01c6f1751fd97c2bd3d7e7f1d5",
      },
      WSTETH: {
        poolId:
          "0x36bf227d6bac96e2ab1ebb5492ecec69c691943f000200000000000000000316",
        tokenOut: "0x5979d7b546e38e414f7e9822514be443a4800529",
        tokenIn: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
        networkConfig: {
          network: Network.ARBITRUM,
          rpcUrl: config.arbitrumRpcUrls[0],
        },
      },
      AURA: {
        poolId:
          "0xcfca23ca9ca720b6e98e3eb9b6aa0ffc4a5c08b9000200000000000000000274",
        tokenIn: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        tokenOut: "0xc0c293ce456ff0ed870add98a0828dd4d2903dbf",
      },
    },
  },
  "balancer-lusd": {
    pairedToken: "LUSD",
    poolsConfigs: {
      GHO: {
        poolId:
          "0x3fa8c89704e5d07565444009e5d9e624b40be813000000000000000000000599",
        tokenIn: "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0",
        tokenOut: "0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f",
      },
    },
  },
};
