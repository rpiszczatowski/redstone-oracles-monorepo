import TraderJoeAutoPoolTokenAbi from "./TraderJoeAutoPoolToken.abi.json";

export const traderJoeAutoPoolTokenContractDetails = {
  TJ_AVAX_USDC_AUTO: {
    address: "0x32833a12ed3Fd5120429FB01564c98ce3C60FC1d",
    abi: TraderJoeAutoPoolTokenAbi,
    token0Decimals: 18,
    token1Decimals: 6,
    tokensToFetch: ["AVAX", "USDC"],
  },
};
