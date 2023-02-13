import { WrapperBuilder } from "../../src/index";
import { ethers } from "ethers";
import { contractAddress, abi } from "./constants";
import { DataPackagesResponse } from "redstone-sdk";

describe("WrapperBuilder", () => {
  it("It should wrap Signer Contract", async () => {
    let provider = new ethers.providers.JsonRpcProvider(
      "https://api.avax.network/ext/bc/C/rpc"
    );
    let contract = new ethers.Contract(contractAddress.address, abi, provider);

    const dataPackages: DataPackagesResponse = {};
    const wrappedContract =
      WrapperBuilder.wrap(contract).usingDataPackages(dataPackages);
    const result = await wrappedContract.usdg();

    console.log(result);
  });
});
