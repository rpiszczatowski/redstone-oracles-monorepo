import abi from "./CurveErc20.abi.json";

export const curveTokensContractsDetails = {
  crvUSDBTCETH: {
    address: "0x1daB6560494B04473A0BE3E7D83CF3Fdf3a51828",
    abi,
    contractWithBalancesAddress: "0xB755B949C126C04e0348DD881a5cF55d424742B2",
    avWBTCAddress: "0x686bEF2417b6Dc32C50a3cBfbCC3bb60E1e9a15D",
    avWETHAddress: "0x53f7c5869a859F0AeC3D334ee8B4Cf01E3492f21",
    av3CRVAddress: "0x1337BedC9D22ecbe766dF105c9623922A27963EC",
    tokensToFetch: ["BTC", "ETH", "CRV"],
  },
};
