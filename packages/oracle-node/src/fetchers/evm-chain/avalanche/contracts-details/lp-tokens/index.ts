import TraderJoeLpAbi from "./TraderJoeLP.abi.json";
import PangolinLpAbi from "./PangolinLP.abi.json";

export const lpTokensContractsDetails = {
  PNG_AVAX_USDC_LP: {
    address: "0x0e0100ab771e9288e0aa97e11557e6654c3a9665",
    abi: PangolinLpAbi,
    tokensToFetch: ["AVAX", "USDC"],
  },
  PNG_AVAX_USDT_LP: {
    address: "0xe3bA3d5e3F98eefF5e9EDdD5Bd20E476202770da",
    abi: PangolinLpAbi,
    tokensToFetch: ["USDT", "AVAX"],
  },
  PNG_AVAX_ETH_LP: {
    address: "0x7c05d54fc5CB6e4Ad87c6f5db3b807C94bB89c52",
    abi: PangolinLpAbi,
    tokensToFetch: ["ETH", "AVAX"],
  },
  TJ_AVAX_USDC_LP: {
    address: "0xf4003f4efbe8691b60249e6afbd307abe7758adb",
    abi: TraderJoeLpAbi,
    tokensToFetch: ["AVAX", "USDC"],
  },
  TJ_AVAX_USDT_LP: {
    address: "0xbb4646a764358ee93c2a9c4a147d5aDEd527ab73",
    abi: TraderJoeLpAbi,
    tokensToFetch: ["USDT", "AVAX"],
  },
  TJ_AVAX_ETH_LP: {
    address: "0xFE15c2695F1F920da45C30AAE47d11dE51007AF9",
    abi: TraderJoeLpAbi,
    tokensToFetch: ["ETH", "AVAX"],
  },
  TJ_AVAX_BTC_LP: {
    address: "0x2fD81391E30805Cc7F2Ec827013ce86dc591B806",
    abi: TraderJoeLpAbi,
    tokensToFetch: ["BTC", "AVAX"],
  },
  TJ_AVAX_sAVAX_LP: {
    address: "0x4b946c91C2B1a7d7C40FB3C130CdfBaf8389094d",
    abi: TraderJoeLpAbi,
    tokensToFetch: ["sAVAX", "AVAX"],
  },
};
