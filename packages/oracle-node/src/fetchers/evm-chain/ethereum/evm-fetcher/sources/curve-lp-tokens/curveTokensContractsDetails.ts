import abi from "../../../../shared/abis/CurveToken.abi.json";
import erc20abi from "../../../../shared/abis/CurveErc20.abi.json";

export const curveTokensContractsDetails = {
  erc20abi,
  abi,
  crvFRAX: {
    erc20Address: "0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC",
    poolAddress: "0xDcEF968d416a41Cdac0ED8702fAC8128A64241A2",
    tokens: [
      { name: "FRAX", decimals: 18 },
      { name: "USDC", decimals: 6 },
    ],
  },
  "3Crv": {
    erc20Address: "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490",
    poolAddress: "0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7",
    tokens: [
      { name: "DAI", decimals: 18 },
      { name: "USDC", decimals: 6 },
      { name: "USDT", decimals: 6 },
    ],
  },
};
