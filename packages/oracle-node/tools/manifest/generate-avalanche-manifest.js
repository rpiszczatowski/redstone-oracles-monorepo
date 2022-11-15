const generateSubManifest = require("./generate-submanifest-from-main");

const OUTPUT_FILE_PATH = "./manifests/data-services/avalanche.json";
const SYMBOLS = [
  "ETH",
  "USDT",
  "PNG",
  "AVAX",
  "WAVAX",
  "XAVA",
  "LINK",
  "BTC",
  "FRAX",
  "YAK",
  "QI",
  "USDC",
  "YYAV3SA1",
  "sAVAX",
  "PTP",
  "YY_PTP_sAVAX_FT",
  "TJ_AVAX_USDC_LP",
  "PNG_AVAX_USDC_LP",
  "YY_TJ_AVAX_USDC_LP",
  "MOO_TJ_AVAX_USDC_LP",
  "PNG_AVAX_USDT_LP",
  "TJ_AVAX_USDT_LP",
  "TJ_AVAX_sAVAX_LP",
  "PNG_AVAX_ETH_LP",
  "TJ_AVAX_ETH_LP",
  "TJ_AVAX_BTC_LP",
  "YY_PNG_AVAX_USDC_LP",
  "YY_PNG_AVAX_ETH_LP",
  "YY_TJ_AVAX_sAVAX_LP",
  "YY_TJ_AVAX_ETH_LP",
];

generateSubManifest(SYMBOLS, OUTPUT_FILE_PATH);
