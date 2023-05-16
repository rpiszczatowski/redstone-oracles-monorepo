import { expect } from "chai";
import { changeInNewyorkfedResponseCondition } from "../../src/core/update-conditions/change-in-newyorkfed-repsonse-condition";
import { differentMockNewYorkFedResponse, mockEnvVariables } from "../helpers";
import { invalidHandlers, server } from "./mock-server";
import { storeLastNewYorkFedResponse } from "../../src/core/local-cache";

describe("change-in-newyorkfed-response-condition", () => {
  before(() => {
    mockEnvVariables();
    server.listen();
  });

  beforeEach(async () => {
    await changeInNewyorkfedResponseCondition();
  });

  afterEach(() => server.resetHandlers());
  after(() => server.close());

  it("should return false if response is the same as in cache", async () => {
    const { shouldUpdatePrices, warningMessage } =
      await changeInNewyorkfedResponseCondition();
    expect(shouldUpdatePrices).to.be.false;
    expect(warningMessage).to.be.equal(
      "Cached values and fetched from New York Fed are the same"
    );
  });

  it("should return true if response is not the same as in cache", async () => {
    storeLastNewYorkFedResponse(differentMockNewYorkFedResponse);
    const { shouldUpdatePrices, warningMessage } =
      await changeInNewyorkfedResponseCondition();
    expect(shouldUpdatePrices).to.be.true;
    expect(warningMessage).to.be.equal("");
  });

  it("should throw error if fetching failed", async () => {
    server.use(...invalidHandlers);
    await expect(changeInNewyorkfedResponseCondition()).to.be.rejectedWith(
      "Cannot fetch and compare data from New York Fed"
    );
  });
});
