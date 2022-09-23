import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { generateSaltForVote } from "../src/utils";

const COMMIT_PERIOD_SECONDS = 4 * 24 * 3600; // 4 days
const REVEAL_PERIOD_SECONDS = 3 * 24 * 3600; // 3 days

// Use evm_increaseTime to manipulate timestamp: https://ethereum.stackexchange.com/questions/86633/time-dependent-tests-with-hardhat

describe("Dispute resolution engine", () => {
  let signers: SignerWithAddress[];
  let dataProvider: SignerWithAddress;
  let disputeCreator: SignerWithAddress;
  let voters: SignerWithAddress[];

  const deployContracts = async () => {};
  const prepareContracts = async () => {
    // Stake tokens by "data provider"
  };
  const createDispute = async (
    accusedAddress: string,
    lockedTokensAmount: number
  ) => {};
  const checkDisputes = async (expectedDisputesCount: number) => {};
  const commitVote = async (
    disputeId: number,
    lockedTokensAmount: number,
    votedForGuilty: boolean,
    signer: SignerWithAddress
  ) => {};
  const revealVote = async (
    disputeId: number,
    votedForGuilty: boolean,
    signer: SignerWithAddress
  ) => {};
  const increaseBlockTimestamp = async (seconds: number) => {};
  const settleDispute = async (disputeId: number) => {};
  const launchDisputeAndVote = async () => {
    await createDispute(dataProvider.address, 10000);

    // Commiting votes
    await commitVote(0, 5000, true, voters[0]);
    await commitVote(0, 10000, false, voters[1]);
    await commitVote(0, 5000, true, voters[2]);

    await increaseBlockTimestamp(COMMIT_PERIOD_SECONDS + 1);

    // Revealing votes
    await revealVote(0, true, voters[0]);
    await revealVote(0, false, voters[1]);
    await revealVote(0, true, voters[2]);
  };

  beforeEach(async () => {
    await deployContracts();
    await prepareContracts();
  });

  it("Should properly create dispute", async () => {
    await createDispute(dataProvider.address, 10000);
    await checkDisputes(1);
  });

  it("Should not create dispute if not enough tokens staked", async () => {
    await expect(createDispute(dataProvider.address, 9999)).to.be.revertedWith(
      "Insufficient locked tokens amount for dispute creation"
    );
  });

  it("Should properly commit vote", async () => {
    await createDispute(dataProvider.address, 10000);
    await commitVote(0, 5000, true, voters[0]);
    // TODO: get vote and test
  });

  it("Should not commit vote with insufficient amount of tokens", async () => {
    await createDispute(dataProvider.address, 10000);
    await expect(commitVote(0, 4999, true, voters[0])).to.be.revertedWith(
      "Insuff..."
    );
  });

  it("Should not commit vote twice for the same dispute", async () => {
    await createDispute(dataProvider.address, 10000);
    await commitVote(0, 5000, true, voters[0]);
    await expect(commitVote(0, 4999, true, voters[0])).to.be.revertedWith(
      "Insuff..."
    );
  });

  it("Should commit and reveal vote", async () => {
    await createDispute(dataProvider.address, 10000);
    await commitVote(0, 5000, true, voters[0]);
    await increaseBlockTimestamp(COMMIT_PERIOD_SECONDS + 1);
    await revealVote(0, true, voters[0]);
    // TODO: get vote and test
  });

  it("Should not reveal with an incorrect salt", async () => {
    await createDispute(dataProvider.address, 10000);
    await commitVote(0, 5000, true, voters[0]);
    await increaseBlockTimestamp(COMMIT_PERIOD_SECONDS + 1);
    await expect(revealVote(0, false, voters[0])).to.be.revertedWith(
      "Invalid salt..."
    );
  });

  it("Should properly settle dispute", async () => {
    await launchDisputeAndVote();
    await increaseBlockTimestamp(REVEAL_PERIOD_SECONDS);
    await settleDispute(0);
    // TODO: test the dispute result
  });

  it("Should not settle dispute that has not ended", async () => {
    await launchDisputeAndVote();
    await expect(settleDispute(0)).to.be.revertedWith("Has not ended...");
  });

  it("Should not settle dispute that has already been settled", async () => {
    await launchDisputeAndVote();
    await increaseBlockTimestamp(REVEAL_PERIOD_SECONDS);
    await settleDispute(0);
    await expect(settleDispute(0)).to.be.revertedWith(
      "Already has been  settled..."
    );
  });

  it("Should properly claim reward for settled dispute", async () => {
    await launchDisputeAndVote();
    await increaseBlockTimestamp(REVEAL_PERIOD_SECONDS);
    await settleDispute(0);
    // TODO: test claimable rewards
  });
});
