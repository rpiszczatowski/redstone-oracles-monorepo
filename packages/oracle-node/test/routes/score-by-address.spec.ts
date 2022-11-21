import { Express } from "express";
import request from "supertest";
import { clearRecordedAddresses } from "../../src/routes/services/RateLimitingService";
import { getApp } from "./_helpers";
import { Wallet } from "ethers";
import { prepareMessageToSign, UniversalSigner } from "redstone-protocol";

jest.mock("../../src/routes/score-by-address.ts", () => ({
  ...jest.requireActual("../../src/routes/score-by-address.ts"),
  fetchScoreForAddress: () => Promise.resolve(800),
}));

const mockedTimestamp = 1666082293466;
jest.useFakeTimers().setSystemTime(mockedTimestamp);

describe("Score by address requests route", () => {
  let app: Express;
  let timestamp: number;
  let signature: string;

  beforeAll(async () => {
    ({ timestamp, signature } = await getQueryParams());
  });

  beforeEach(() => {
    app = getApp();
  });

  test("Should send correct response", async () => {
    const response = await request(app)
      .get("/score-by-address")
      .query({
        timestamp,
        signature,
        scoreType: "test",
      })
      .expect(200);

    expect(response.body).toEqual({
      signature:
        "iD3Ik5QNqFALr4JXPh0z9gdvf+kb7jBrF+rZdYQaQwlP/Hv7FzG01LqBDhRIJrw6Y3Vf5nDt1BlSGhM4gmeIlBw=",
      dataPoints: [
        {
          dataFeedId: "0x5A433Fd93b8CA273d5BA255D531ce9A1E20E1B43",
          value: 800,
          decimals: 0,
        },
      ],
      timestampMilliseconds: mockedTimestamp,
    });
  });

  test("Should send correct response twice after one hour", async () => {
    const firstResponse = await request(app)
      .get("/score-by-address")
      .query({
        timestamp,
        signature,
        scoreType: "test",
      })
      .expect(200);

    expect(firstResponse.body).toEqual({
      signature:
        "iD3Ik5QNqFALr4JXPh0z9gdvf+kb7jBrF+rZdYQaQwlP/Hv7FzG01LqBDhRIJrw6Y3Vf5nDt1BlSGhM4gmeIlBw=",
      dataPoints: [
        {
          dataFeedId: "0x5A433Fd93b8CA273d5BA255D531ce9A1E20E1B43",
          value: 800,
          decimals: 0,
        },
      ],
      timestampMilliseconds: mockedTimestamp,
    });

    jest.setSystemTime(mockedTimestamp + 70 * 60 * 1000);
    jest.advanceTimersByTime(70 * 1000);
    jest.setSystemTime(mockedTimestamp);

    const secondResponse = await request(app)
      .get("/score-by-address")
      .query({
        timestamp,
        signature,
        scoreType: "test",
      })
      .expect(200);

    expect(secondResponse.body).toEqual({
      signature:
        "iD3Ik5QNqFALr4JXPh0z9gdvf+kb7jBrF+rZdYQaQwlP/Hv7FzG01LqBDhRIJrw6Y3Vf5nDt1BlSGhM4gmeIlBw=",
      dataPoints: [
        {
          dataFeedId: "0x5A433Fd93b8CA273d5BA255D531ce9A1E20E1B43",
          value: 800,
          decimals: 0,
        },
      ],
      timestampMilliseconds: mockedTimestamp,
    });
  });

  test("Shouldn't throw error if two requests within 800 hour", async () => {
    await request(app)
      .get("/score-by-address")
      .query({
        timestamp,
        signature,
        scoreType: "test",
      })
      .expect(200);

    const response = await request(app)
      .get("/score-by-address")
      .query({
        timestamp,
        signature,
        scoreType: "test",
      })
      .expect(200);
    expect(response.body).toEqual({
      signature:
        "iD3Ik5QNqFALr4JXPh0z9gdvf+kb7jBrF+rZdYQaQwlP/Hv7FzG01LqBDhRIJrw6Y3Vf5nDt1BlSGhM4gmeIlBw=",
      dataPoints: [
        {
          dataFeedId: "0x5A433Fd93b8CA273d5BA255D531ce9A1E20E1B43",
          value: 800,
          decimals: 0,
        },
      ],
      timestampMilliseconds: mockedTimestamp,
    });
  });

  test("Should throw error if requested more than max within 800 hour", async () => {
    for (const _key of [...Array(5).keys()]) {
      await request(app)
        .get("/score-by-address")
        .query({
          timestamp,
          signature,
          scoreType: "test",
        })
        .expect(200);
    }

    const response = await request(app)
      .get("/score-by-address")
      .query({
        timestamp,
        signature,
        scoreType: "test",
      })
      .expect(400);
    expect(response.body).toEqual({
      error:
        "Address 0x5A433Fd93b8CA273d5BA255D531ce9A1E20E1B43 reached rate limit. Please try in an hour",
    });
  });

  test("Should throw error if missing timestamp in request", async () => {
    const response = await request(app)
      .get("/score-by-address")
      .query({
        signature,
        scoreType: "test",
      })
      .expect(400);
    expect(response.body).toEqual({
      error: "Invalid request, missing parameter",
    });
  });

  test("Should throw error if missing signature in request", async () => {
    const response = await request(app)
      .get("/score-by-address")
      .query({
        timestamp,
        scoreType: "test",
      })
      .expect(400);
    expect(response.body).toEqual({
      error: "Invalid request, missing parameter",
    });
  });

  test("Should throw error if missing score type in request", async () => {
    const response = await request(app)
      .get("/score-by-address")
      .query({
        timestamp,
        signature,
      })
      .expect(400);
    expect(response.body).toEqual({
      error: "Invalid request, missing parameter",
    });
  });

  test("Should throw error if invalid timestamp", async () => {
    const response = await request(app)
      .get("/score-by-address")
      .query({
        timestamp: timestamp - 20 * 60 * 1000,
        signature,
        scoreType: "test",
      })
      .expect(400);
    expect(response.body).toEqual({
      error: "Invalid timestamp, it should be less than 10 minutes ago",
    });
  });

  afterEach(() => {
    clearRecordedAddresses();
  });
});

const getQueryParams = async () => {
  const timestamp = mockedTimestamp - 10 * 1000;
  const signer = new Wallet(
    "0xd14d1c078c6219fe2ed6e02c05b4a376f8161a05255611aa8d5e39ee06d0bc4e"
  );
  const message = prepareMessageToSign(timestamp);
  const signature = await UniversalSigner.signWithEthereumHashMessage(
    signer,
    message
  );

  return { timestamp, signature };
};
