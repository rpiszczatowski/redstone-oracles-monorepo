import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

describe("PriceFeedWithRounds", () => {

  it("should properly initialize", async () => {
    expect(1).to.be.equal(1);
  });

  it("should return an empty list of data feeds", async () => {
    expect(1).to.be.equal(1);
  });

  it("should properly upgrade the contract", async () => {
    expect(1).to.be.equal(1);
  });

  it("should properly get indexes for data feeds", async () => {
    expect(1).to.be.equal(1);
  });

  it("should revert trying to get index if data feed is not supported", async () => {
    expect(1).to.be.equal(1);
  });

  it("should revert trying to get index if data feed is not supported", async () => {
    expect(1).to.be.equal(1);
  });

  it("should revert trying to update by unauthorised updater", async () => {
    expect(1).to.be.equal(1);
  });

  it("should revert if min interval hasn't passed", async () => {
    expect(1).to.be.equal(1);
  });

  it("should revert if proposed data package timestamp is same as before", async () => {
    expect(1).to.be.equal(1);
  });

  it("should revert if proposed data package timestamp is older as before", async () => {
    expect(1).to.be.equal(1);
  });

  it("should revert if proposed data package timestamp is too old", async () => {
    expect(1).to.be.equal(1);
  });

  it("should revert if proposed data package timestamp is too new", async () => {
    expect(1).to.be.equal(1);
  });

  it("should revert if at least one timestamp isn't equal to proposed timestamp", async () => {
    expect(1).to.be.equal(1);
  });

  it("should revert if redstone payload is not attached", async () => {
    expect(1).to.be.equal(1);
  });

  it("should revert if a data feed is missed in redstone payload", async () => {
    expect(1).to.be.equal(1);
  });

  it("should properly update data feeds one time", async () => {
    expect(1).to.be.equal(1);
  });

  it("should properly update data feeds several times", async () => {
    expect(1).to.be.equal(1);
  });

  it("should get a single data feed value", async () => {
    expect(1).to.be.equal(1);
  });

  it("should get several data feed values", async () => {
    expect(1).to.be.equal(1);
  });

  it("should revert trying to get invalid (zero) data feed value", async () => {
    expect(1).to.be.equal(1);
  });

  it("should revert trying to get a value for an unsupported data feed", async () => {
    expect(1).to.be.equal(1);
  });

  it("should revert trying to get several values, if one data feed is not supported", async () => {
    expect(1).to.be.equal(1);
  });

  it("should revert trying to get several values, if one data feed has invalid (zero) value", async () => {
    expect(1).to.be.equal(1);
  });

  // Rounds specific tests

  it("should properly get latest round id", async () => {
    expect(1).to.be.equal(1);
  });

  it("should properly get latest round params", async () => {
    expect(1).to.be.equal(1);
  });

  it("should properly get values for different (valid) rounds", async () => {
    expect(1).to.be.equal(1);
  });

  it("should revert trying to get values for invalid rounds", async () => {
    expect(1).to.be.equal(1);
  });

  it("should properly get values and timestamps for different (valid) rounds", async () => {
    expect(1).to.be.equal(1);
  });

  it("should revert trying to get values and timestamps for invalid rounds", async () => {
    expect(1).to.be.equal(1);
  });

});
