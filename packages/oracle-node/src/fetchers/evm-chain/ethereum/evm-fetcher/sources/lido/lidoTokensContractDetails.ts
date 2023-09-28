import WSTETHContractAbi from "./WSTETHContract.abi.json";

interface ContractsDetails {
  [dataFeedId: string]: {
    address: string;
    underlyingToken?: string;
  };
}

export const lidoTokensContractDetails = {
  abi: WSTETHContractAbi,
  contractsDetails: {
    wstETH_FUNDAMENTAL: {
      address: "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
      underlyingToken: "STETH",
    },
    "wstETH/stETH": {
      address: "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0",
    },
  } as ContractsDetails,
};
