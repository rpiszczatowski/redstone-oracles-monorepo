import { PermaswapPoolsConfig } from "./PermaswapFetcher";

export const pools: PermaswapPoolsConfig = {
  ARDRIVE: {
    poolAddress:
      "0xbb546a762e7d5f24549cfd97dfa394404790293277658e42732ab3b2c4345fa3",
    pairedToken: "AR",
    direction: "currentPriceUp",
  },
  ACNH: {
    poolAddress:
      "0x7200199c193c97012893fd103c56307e44434322439ece7711f28a8c3512c082",
    pairedToken: "USDC",
    direction: "currentPriceUp",
  },
  ANS: {
    poolAddress:
      "0x6e80137a5bbb6ae6b683fcd8a20978d6b4632dddc78aa61945adbcc5a197ca0f",
    pairedToken: "AR",
    direction: "currentPriceUp",
  },
};
