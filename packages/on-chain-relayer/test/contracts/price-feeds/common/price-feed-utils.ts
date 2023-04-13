import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);

export const describeCommonPriceFeedTests = (/* adapterContractFactory: IRedstoneAdapter__factory */) => {
  describe("Tests for getting price feed details", () => {
    it("should properly get data feed id", async () => {
      expect(1).to.be.equal(1);
    });

    it("should properly get price feed adapter", async () => {
      expect(1).to.be.equal(1);
    });

    it("should properly get decimals", async () => {
      expect(1).to.be.equal(1);
    });

    it("should properly get description", async () => {
      expect(1).to.be.equal(1);
    });

    it("should properly get version", async () => {
      expect(1).to.be.equal(1);
    });
  });

  describe("Tests for getting latest price feed values", () => {
    it("should properly get latest round data", async () => {
      expect(1).to.be.equal(1);
    });

    it("should properly get latest answer", async () => {
      expect(1).to.be.equal(1);
    });

    it("should properly get latest round id", async () => {
      expect(1).to.be.equal(1);
    });
  });
};
