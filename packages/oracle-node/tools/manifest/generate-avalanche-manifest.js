const generateSubManifest = require("./generate-submanifest-from-main");

const OUTPUT_FILE_PATH = "./manifests/data-services/avalanche.json";
const SYMBOLS = [
  "ETH",
  "USDT",
  "PNG",
  "AVAX",
  "XAVA",
  "LINK",
  "BTC",
  "FRAX",
  "YAK",
  "QI",
  "USDC",
  "YYAV3SA1",
  "sAVAX",
  "SAV2",
  "TJ_AVAX_USDC_LP",
  "PNG_AVAX_USDC_LP",
  "YY_TJ_AVAX_USDC_LP",
  "MOO_TJ_AVAX_USDC_LP",
  "PTP",
];

generateSubManifest(SYMBOLS, OUTPUT_FILE_PATH);
