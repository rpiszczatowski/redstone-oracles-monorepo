export const WOMBAT_POOL_ABI = [
  {
    name: "quotePotentialSwap",
    outputs: [
      { type: "uint256", name: "potentialOutcome" },
      { type: "uint256", name: "haircut" },
    ],
    inputs: [
      { type: "address", name: "fromToken" },
      { type: "address", name: "toToken" },
      { type: "int256", name: "fromAmount" },
    ],
    stateMutability: "view",
    type: "function",
  },
];
