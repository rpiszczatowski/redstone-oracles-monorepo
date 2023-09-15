import GlpManagerAbi from "../../../../shared/abis/GlpManager.abi.json";
import { TokenContractDetails } from "../../../../shared/request-handlers/GlpManagerRequestHandlers";

export const glpManagerContractsDetails = {
  GLP: {
    abi: GlpManagerAbi,
    address: "0x3963FfC9dff443c2A94f21b129D429891E32ec18",
  } as unknown as TokenContractDetails,
};
