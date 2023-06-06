import { ethereumProvider } from "../../utils/blockchain-providers";

export default {
  // this contract is stateless
  poolInformationAddress: "0xadc6ced7666779ede88e82c95e363450ac59bfd3",
  provider: ethereumProvider,
  tokens: {
    SWETH: {
      pairedToken: "WETH",
      poolAddress: "0x0CE176E1b11A8f88a4Ba2535De80E81F88592bad",
    },
  },
};
