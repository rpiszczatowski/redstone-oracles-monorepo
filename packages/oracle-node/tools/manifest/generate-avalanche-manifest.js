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
  "TJ_WAVAX_USDC_LP",
  "PNG_WAVAX_USDC_LP",
  "YY_TJ_WAVAX_USDC_LP",
  "MOO_TJ_WAVAX_USDC_LP",
  "PNG_USDT_WAVAX_LP",
  "TJ_USDT_WAVAX_LP",
  "TJ_sAVAX_WAVAX_LP",
  "PNG_WETH_WAVAX_LP",
  "TJ_WETH_WAVAX_LP",
  "TJ_BTC_WAVAX_LP",
  "YY_PNG_WAVAX_USDC_LP",
  "YY_PNG_WETH_WAVAX_LP",
  "YY_TJ_sAVAX_WAVAX_LP",
  "YY_TJ_WETH_WAVAX_LP",
  "YY_PTP_SAVAX_FT",
];

generateSubManifest(SYMBOLS, OUTPUT_FILE_PATH);
