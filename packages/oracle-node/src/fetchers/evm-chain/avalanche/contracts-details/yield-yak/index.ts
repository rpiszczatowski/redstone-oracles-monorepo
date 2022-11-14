import YieldYakAaveAVAXAbi from "./YYAaveAVAX.abi.json";
import YieldYakSAVAXAbi from "./YYSAVAX.abi.json";
import YYTraderJoeLPTokenAbi from "./YYTraderJoeLPToken.abi.json";
import YYPangolinLPTokenAbi from "./YYPangolinLPToken.abi.json";

export const yieldYakContractsDetails = {
  YYAV3SA1: {
    address: "0xaAc0F2d0630d1D09ab2B5A400412a4840B866d95",
    abi: YieldYakAaveAVAXAbi,
  },
  SAV2: {
    address: "0xd0F41b1C9338eB9d374c83cC76b684ba3BB71557",
    abi: YieldYakSAVAXAbi,
  },
  YY_TJ_WAVAX_USDC_LP: {
    address: "0xDEf94a13fF31FB6363f1e03bF18fe0F59Db83BBC",
    abi: YYTraderJoeLPTokenAbi,
  },
  YY_PNG_WAVAX_USDC_LP: {
    address: "0xC0cd58661b68e10b49D3Bec4bC5E44e7A7c20656",
    abi: YYPangolinLPTokenAbi,
  },
  YY_PNG_WETH_WAVAX_LP: {
    address: "0xFCD2050E213cC54db2c9c99632AC870574FbC261",
    abi: YYPangolinLPTokenAbi,
  },
  YY_TJ_sAVAX_WAVAX_LP: {
    address: "0x22EDe03f1115666CF05a4bAfafaEe8F43D42cD56",
    abi: YYTraderJoeLPTokenAbi,
  },
  YY_TJ_WETH_WAVAX_LP: {
    address: "0x5219558ee591b030E075892acc41334A1694fd8A",
    abi: YYTraderJoeLPTokenAbi,
  },
};
