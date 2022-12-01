const generateSubManifest = require("./generate-submanifest-from-main");

const OUTPUT_FILE_PATH = "./manifests/data-services/avalanche.json";
const SYMBOLS = [
  "ETH",
  "USDT",
  "PNG",
  "AVAX",
  "LINK",
  "BTC",
  "QI",
  "USDC",
  "sAVAX",
  "PTP",
  "YY_AAVE_AVAX",
  "YY_PTP_sAVAX",
  "PNG_AVAX_USDC_LP",
  "PNG_AVAX_USDT_LP",
  "PNG_AVAX_ETH_LP",
  "TJ_AVAX_USDC_LP",
  "TJ_AVAX_USDT_LP",
  "TJ_AVAX_ETH_LP",
  "TJ_AVAX_BTC_LP",
  "TJ_AVAX_sAVAX_LP",
  "MOO_TJ_AVAX_USDC_LP",
  "YY_PNG_AVAX_USDC_LP",
  "YY_PNG_AVAX_ETH_LP",
  "YY_TJ_AVAX_sAVAX_LP",
  "YY_TJ_AVAX_USDC_LP",
  "YY_TJ_AVAX_ETH_LP",
  "XAVA",
  "YAK",
  "YYAV3SA1",
];

generateSubManifest(SYMBOLS, OUTPUT_FILE_PATH);
