import YieldYakAaveAVAXAbi from "./YYAaveAVAX.abi.json";
import YYPangolinSAVAXAbi from "./YYPangolinSAVAX.abi.json";
import YYTraderJoeLPTokenAbi from "./YYTraderJoeLPToken.abi.json";
import YYPangolinLPTokenAbi from "./YYPangolinLPToken.abi.json";

export const yieldYakContractsDetails = {
  YYAV3SA1: {
    address: "0xaAc0F2d0630d1D09ab2B5A400412a4840B866d95",
    abi: YieldYakAaveAVAXAbi,
    tokenToFetch: "AVAX",
  },
  YY_PTP_sAVAX_FT: {
    address: "0xb8f531c0d3c53B1760bcb7F57d87762Fd25c4977",
    abi: YYPangolinSAVAXAbi,
    tokenToFetch: "sAVAX",
  },
  YY_TJ_AVAX_USDC_LP: {
    address: "0xDEf94a13fF31FB6363f1e03bF18fe0F59Db83BBC",
    abi: YYTraderJoeLPTokenAbi,
    tokenToFetch: "TJ_AVAX_USDC_LP",
  },
  YY_PNG_AVAX_USDC_LP: {
    address: "0xC0cd58661b68e10b49D3Bec4bC5E44e7A7c20656",
    abi: YYPangolinLPTokenAbi,
    tokenToFetch: "PNG_AVAX_USDC_LP",
  },
  YY_PNG_AVAX_ETH_LP: {
    address: "0xFCD2050E213cC54db2c9c99632AC870574FbC261",
    abi: YYPangolinLPTokenAbi,
    tokenToFetch: "PNG_AVAX_ETH_LP",
  },
  YY_TJ_AVAX_sAVAX_LP: {
    address: "0x22EDe03f1115666CF05a4bAfafaEe8F43D42cD56",
    abi: YYTraderJoeLPTokenAbi,
    tokenToFetch: "TJ_AVAX_sAVAX_LP",
  },
  YY_TJ_AVAX_ETH_LP: {
    address: "0x5219558ee591b030E075892acc41334A1694fd8A",
    abi: YYTraderJoeLPTokenAbi,
    tokenToFetch: "TJ_AVAX_ETH_LP",
  },
};
