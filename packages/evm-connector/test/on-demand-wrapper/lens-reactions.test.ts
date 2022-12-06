import { SampleLensReactionsConsumer } from "../../typechain-types";
import { expect, util } from "chai";
import { ethers } from "hardhat";
import { WrapperBuilder } from "../../src/index";
import { getServer } from "../helpers/mock-server";
import { SetupServerApi } from "msw/node";

describe("SampleLensReactionsConsumer", () => {
    let server: SetupServerApi;

    before(() => {
        server = getServer();
        server.listen()
    });

    afterEach(() => server.resetHandlers());

    it("Should pass reactions to contract", async () => {
        const contract = await getContract();
        const postId = ethers.utils.hexZeroPad("0x01", 32);

        const wrappedContract = WrapperBuilder.wrap(contract).usingOnDemandRequest(
            [
                "http://first-node.com/lens-reactions",
                "http://second-node.com/lens-reactions",
            ],
            { postId }
        );


        const transaction = await wrappedContract.executeActionPassingLensReactions("0x01");
        await transaction.wait();

        const passedReactionsValue = await contract.getPassedOracleData();
        expect(passedReactionsValue).to.be.equal(10);
    });

    it("Should revert if invalid response from one node", async () => {
        const contract = await getContract();
        const postId = ethers.utils.hexZeroPad("0x01", 32);

        const wrappedContract = WrapperBuilder.wrap(contract).usingOnDemandRequest(
            [
                "http://invalid-node.com/lens-reactions",
                "http://second-node.com/lens-reactions",
            ],
            { postId }
        );

        await expect(wrappedContract.executeActionPassingLensReactions("0x01")).to.be.revertedWith(
            "InsufficientNumberOfUniqueSigners(1, 2)"
        );
    });

    it("Should revert if value from nodes is not equal", async () => {
        const contract = await getContract();
        const postId = ethers.utils.hexZeroPad("0x01", 32);

        const wrappedContract = WrapperBuilder.wrap(contract).usingOnDemandRequest(
            [
                "http://first-node.com/lens-reactions",
                "http://invalid-value-node.com/lens-reactions",
            ],
            { postId }
        );

        await expect(wrappedContract.executeActionPassingLensReactions("0x01")).to.be.revertedWith(
            "AllValuesMustBeEqual()"
        );
    });

    it("Should revert if two calls to same node", async () => {
        const contract = await getContract();
        const postId = ethers.utils.hexZeroPad("0x01", 32);

        const wrappedContract = WrapperBuilder.wrap(contract).usingOnDemandRequest(
            [
                "http://first-node.com/lens-reactions",
                "http://first-node.com/lens-reactions",
            ],
            { postId }
        );

        await expect(wrappedContract.executeActionPassingLensReactions("0x01")).to.be.revertedWith(
            "InsufficientNumberOfUniqueSigners(1, 2)"
        );
    });

});



const getContract = async (
    isValidSigner: boolean = true
): Promise<SampleLensReactionsConsumer> => {
    const signers = await ethers.getSigners();
    const ContractFactory = await ethers.getContractFactory(
        "SampleLensReactionsConsumer",
        isValidSigner ? signers[0] : signers[1]
    );
    const contract = await ContractFactory.deploy();
    await contract.deployed();

    return contract;
};
