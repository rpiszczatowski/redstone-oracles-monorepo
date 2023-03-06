import { WrapperBuilder } from "../../src/index";
import { ethers } from "hardhat";

import { Signer } from "ethers";
import { expect } from "chai";
import { deployMockContract, MockProvider } from "ethereum-waffle";
import { abi } from "./mock-token.json";

describe("WrapperBuilder", () => {
  let wrappedContract: any, signer: Signer, address: string;

  it("It should wrap Signer Contract", async () => {
    const provider = new MockProvider();
    const [wallet] = provider.getWallets();

    const erc20MockContract = await deployMockContract(wallet, abi);
    await erc20MockContract.deployed();

    [signer] = await ethers.getSigners();
    address = await signer.getAddress();

    await erc20MockContract.mock.symbol.returns("MockToken");

    const wrappedContract = WrapperBuilder.wrap(
      erc20MockContract
    ).usingMockDataPackages([]);

    expect(await wrappedContract.symbol()).to.equal("MockToken");
  });
});
