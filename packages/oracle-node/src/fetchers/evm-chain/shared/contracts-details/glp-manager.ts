import GlpManagerAbi from "../abis/GlpManager.abi.json";

export const glpManagerContractsDetails = {
  GLP: {
    abi: GlpManagerAbi,
  },
};

export type GlpManagerDetailsKeys = keyof typeof glpManagerContractsDetails;

export const glpToken = Object.keys(glpManagerContractsDetails);
