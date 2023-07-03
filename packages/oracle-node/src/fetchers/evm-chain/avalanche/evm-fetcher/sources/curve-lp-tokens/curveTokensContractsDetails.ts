import abi from "../../../../shared/abis/CurveToken.abi.json";
import erc20abi from "../../../../shared/abis/CurveErc20.abi.json";

export const curveTokensContractsDetails = {
  erc20abi,
  abi,
  crvUSDBTCETH: {
    poolAddress: "0xB755B949C126C04e0348DD881a5cF55d424742B2",
    erc20Address: "0x1daB6560494B04473A0BE3E7D83CF3Fdf3a51828",
    tokens: [
      { name: "CRV", decimals: 18 },
      { name: "BTC", decimals: 8 },
      { name: "ETH", decimals: 18 },
    ],
  },
};
