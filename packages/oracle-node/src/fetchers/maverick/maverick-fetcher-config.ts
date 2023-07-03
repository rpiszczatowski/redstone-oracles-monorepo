import { ethereumProvider } from "../../utils/blockchain-providers";

export default {
  // this contract is stateless
  poolInformationAddress: "0xadc6ced7666779ede88e82c95e363450ac59bfd3",
  provider: ethereumProvider,
  tokens: {
    SWETH: {
      token0Symbol: "SWETH",
      token1Symbol: "WETH",
      pairedToken: "ETH",
      poolAddress: "0x0CE176E1b11A8f88a4Ba2535De80E81F88592bad",
    },
    LUSD: {
      token0Symbol: "LUSD",
      token1Symbol: "USDC",
      pairedToken: "USDC",
      poolAddress: "0x6c6FC818b25dF89A8adA8da5A43669023bAD1F4c",
    },
  },
};
