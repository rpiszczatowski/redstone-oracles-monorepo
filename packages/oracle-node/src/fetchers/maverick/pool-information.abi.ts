export const MAVERICK_POOL_INFORMATION_ABI = [
  {
    name: "getSqrtPrice",
    outputs: [{ type: "uint256", name: "sqrtPrice" }],
    inputs: [{ type: "address", name: "pool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    name: "calculateSwap",
    outputs: [{ type: "uint256", name: "returnAmount" }],
    inputs: [
      { type: "address", name: "pool" },
      { type: "uint128", name: "amount" },
      { type: "bool", name: "tokenAIn" },
      { type: "bool", name: "exactOutput" },
      { type: "uint256", name: "sqrtPriceLimit" },
    ],
    stateMutability: "view",
    type: "function",
  },
];
