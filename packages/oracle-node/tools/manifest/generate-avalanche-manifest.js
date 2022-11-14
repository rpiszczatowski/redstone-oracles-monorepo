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
  "SAV2",
  "PTP",
  "TJ_WAVAX_USDC_LP",
  "PNG_WAVAX_USDC_LP",
  "YY_TJ_WAVAX_USDC_LP",
  "MOO_TJ_WAVAX_USDC_LP",
  "PNG_USDT_WAVAX_LP",
];

generateSubManifest(SYMBOLS, OUTPUT_FILE_PATH);
