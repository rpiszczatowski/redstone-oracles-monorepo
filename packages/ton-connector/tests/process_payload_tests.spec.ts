import "@ton-community/test-utils";
import { TonTesterContractAdapter } from "./tester/TonTesterContractAdapter";
import { SIGNERS } from "./TonPrices.spec";

import {
  createContractParamsProviderMock,
  createTesterContractEnv,
  SAMPLE_PACKAGES_TIMESTAMP,
} from "./helpers/test_helpers";
import { TonTesterContractDeployer } from "./tester/TonTesterContractDeployer";

jest.setTimeout(10000);

describe("TON process_payload Tests", () => {
  let testerAdapter: TonTesterContractAdapter;

  beforeAll(async () => {
    const { network, testerCode } = await createTesterContractEnv(
      "process_payload_tests"
    );

    testerAdapter = await new TonTesterContractDeployer(
      network,
      testerCode
    ).getAdapter();
  });

  it("should process payload (simple cases)", async () => {
    const paramsProvider = createContractParamsProviderMock(["ETH", "BTC"]);

    [1, 2].forEach(async (uniqueSignersThreshold) => {
      const { values, minTimestamp } = await testerAdapter.testProcessPayload(
        paramsProvider,
        SIGNERS,
        uniqueSignersThreshold,
        SAMPLE_PACKAGES_TIMESTAMP
      );

      expect(values[0]).toBe(156962499984);
      expect(values[1]).toBe(2242266554738);
      expect(minTimestamp).toBe(SAMPLE_PACKAGES_TIMESTAMP * 1000);
    });
  });

  it("should reject when there is wrong signer", async () => {
    const paramsProvider = createContractParamsProviderMock(
      ["ETH", "BTC"],
      "2sig_ETH_BTC_wrong_sig"
    );

    expect(
      testerAdapter.testProcessPayload(
        paramsProvider,
        SIGNERS,
        2,
        SAMPLE_PACKAGES_TIMESTAMP
      )
    ).rejects.toHaveProperty("exitCode", 300);
  });

  it("should reject when there is missing one data feed", async () => {
    [
      {
        dataFeedsIds: ["ETH", "AVAX", "BTC"],
      },
      {
        dataFeedsIds: ["ETH", "BTC", "AVAX"],
      },
      {
        dataFeedsIds: ["AVAX", "ETH", "BTC"],
      },
      {
        dataFeedsIds: ["AVAX"],
      },
    ].forEach((caseData) => {
      const paramsProvider = createContractParamsProviderMock(
        caseData.dataFeedsIds
      );

      expect(
        testerAdapter.testProcessPayload(
          paramsProvider,
          SIGNERS,
          2,
          SAMPLE_PACKAGES_TIMESTAMP
        )
      ).rejects.toHaveProperty(
        "exitCode",
        300 + caseData.dataFeedsIds.indexOf("AVAX")
      );
    });
  });

  it("should process payload when there is one wrong signer but should skip the value for the signer", async () => {
    const paramsProvider = createContractParamsProviderMock(
      ["ETH", "BTC"],
      "2sig_ETH_BTC_wrong_sig"
    );

    const { values, minTimestamp } = await testerAdapter.testProcessPayload(
      paramsProvider,
      SIGNERS,
      1,
      SAMPLE_PACKAGES_TIMESTAMP
    );

    expect(values[0]).toBe(156954083908);
    expect(values[1]).toBe(2242266554738);
    expect(minTimestamp).toBe(SAMPLE_PACKAGES_TIMESTAMP * 1000);
  });

  it("should reject when timestamps are too future / too old", async () => {
    const paramsProvider = createContractParamsProviderMock(["ETH", "BTC"]);

    [
      { currentTimestampDelta: 901, expectedCode: 201 },
      { currentTimestampDelta: 911, expectedCode: 200 },
      {
        currentTimestampDelta: -171,
        expectedCode: 250,
      },
    ].forEach((caseData) => {
      expect(
        testerAdapter.testProcessPayload(
          paramsProvider,
          SIGNERS,
          1,
          SAMPLE_PACKAGES_TIMESTAMP + caseData.currentTimestampDelta
        )
      ).rejects.toHaveProperty("exitCode", caseData.expectedCode);
    });
  });

  it("should reject when there is wrong RedStone marker", async () => {
    const paramsProvider = createContractParamsProviderMock(
      ["ETH", "BTC"],
      "2sig_ETH_BTC_wrong_marker"
    );

    expect(
      testerAdapter.testProcessPayload(
        paramsProvider,
        SIGNERS,
        1,
        SAMPLE_PACKAGES_TIMESTAMP
      )
    ).rejects.toHaveProperty("exitCode", 500);
  });
});
