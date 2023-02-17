import { WrapperBuilder } from "../../src/index";
import { ethers } from "hardhat";
import { DataPackagesResponse } from "redstone-sdk";

import { SampleSyntheticToken } from "../../typechain-types";
import { Signer } from "ethers";
import { convertStringToBytes32 } from "redstone-protocol/src/common/utils";
import { expect } from "chai";

describe("WrapperBuilder", () => {
  let sampleContract: SampleSyntheticToken,
    wrappedContract: any,
    signer: Signer,
    address: string;

  it("It should wrap Signer Contract", async () => {
    const SampleSyntheticToken = await ethers.getContractFactory(
      "SampleSyntheticToken"
    );
    sampleContract = await SampleSyntheticToken.deploy();
    await sampleContract.initialize(
      convertStringToBytes32("REDSTONE"),
      "SYNTH-REDSTONE",
      "SREDSTONE"
    );
    await sampleContract.deployed();
    [signer] = await ethers.getSigners();
    address = await signer.getAddress();

    const dataPackages: DataPackagesResponse = {};
    const wrappedContract =
      WrapperBuilder.wrap(sampleContract).usingDataPackages(dataPackages);

    expect(await wrappedContract.balanceOf(address)).to.equal(0);
  });
});
