import { glpToken } from "../../shared/contracts-details/glp-manager";
import { extractPriceForGlpToken } from "../../shared/extract-prices";
import { glpManagerAddress } from "./contracts-details/glp-manger-address";
import { MulticallParsedResponses } from "../../../../types";

export const extractPrice = (
  response: MulticallParsedResponses,
  id: string
) => {
  if (glpToken.includes(id)) {
    return extractPriceForGlpToken(response, glpManagerAddress);
  }
};
