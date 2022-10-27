import { Express } from "express";
import request from "supertest";
import axios from "axios";
import { UniversalSigner } from "redstone-protocol";
import { clearRecordedAddresses } from "../../src/routes/services/RateLimitingService";
import { getApp } from "./_helpers";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;
const exampleResponse = 800;
mockedAxios.get.mockResolvedValue({ data: exampleResponse });

const mockedTimestamp = 1666082293466;
jest.useFakeTimers().setSystemTime(mockedTimestamp);

describe("Score by address requests route", () => {
  let app: Express;

  beforeEach(() => {
    app = getApp();
  });

  test("Should send correct response", async () => {
    const { timestamp, signature } = getQueryParams();
    const response = await request(app)
      .get("/score-by-address")
      .query({
        timestamp,
        signature,
      })
      .expect(200);

    expect(response.body).toEqual({
      signature:
        "zngzh3m2e4UaXXTRei+Xd960jfWgi916+GO4nld95JIJISLAGf5yZbnIEJ5wvewUe84kknq4sSjaC/sPOlhNahs=",
      dataPoints: [
        {
          dataFeedId: "0x14682729F1f14f1f16E4a35e6866237AD00E7cfd",
          value: 800,
        },
      ],
      timestampMilliseconds: mockedTimestamp,
    });
  });

  test("Should send correct response twice after one hour", async () => {
    const { timestamp, signature } = getQueryParams();
    const firstResponse = await request(app)
      .get("/score-by-address")
      .query({
        timestamp,
        signature,
      })
      .expect(200);

    expect(firstResponse.body).toEqual({
      signature:
        "zngzh3m2e4UaXXTRei+Xd960jfWgi916+GO4nld95JIJISLAGf5yZbnIEJ5wvewUe84kknq4sSjaC/sPOlhNahs=",
      dataPoints: [
        {
          dataFeedId: "0x14682729F1f14f1f16E4a35e6866237AD00E7cfd",
          value: 800,
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
      })
      .expect(200);

    expect(secondResponse.body).toEqual({
      signature:
        "zngzh3m2e4UaXXTRei+Xd960jfWgi916+GO4nld95JIJISLAGf5yZbnIEJ5wvewUe84kknq4sSjaC/sPOlhNahs=",
      dataPoints: [
        {
          dataFeedId: "0x14682729F1f14f1f16E4a35e6866237AD00E7cfd",
          value: 800,
        },
      ],
      timestampMilliseconds: mockedTimestamp,
    });
  });

  test("Shouldn't throw error if two requests within 1 hour", async () => {
    const { timestamp, signature } = getQueryParams();
    await request(app)
      .get("/score-by-address")
      .query({
        timestamp,
        signature,
      })
      .expect(200);

    const response = await request(app)
      .get("/score-by-address")
      .query({
        timestamp,
        signature,
      })
      .expect(200);
    expect(response.body).toEqual({
      signature:
        "zngzh3m2e4UaXXTRei+Xd960jfWgi916+GO4nld95JIJISLAGf5yZbnIEJ5wvewUe84kknq4sSjaC/sPOlhNahs=",
      dataPoints: [
        {
          dataFeedId: "0x14682729F1f14f1f16E4a35e6866237AD00E7cfd",
          value: 800,
        },
      ],
      timestampMilliseconds: mockedTimestamp,
    });
  });

  test("Should throw error if requested more than max within 1 hour", async () => {
    const { timestamp, signature } = getQueryParams();
    for (const _key of [...Array(5).keys()]) {
      await request(app)
        .get("/score-by-address")
        .query({
          timestamp,
          signature,
        })
        .expect(200);
    }

    const response = await request(app)
      .get("/score-by-address")
      .query({
        timestamp,
        signature,
      })
      .expect(400);
    expect(response.body).toEqual({
      error:
        "Address 0x14682729F1f14f1f16E4a35e6866237AD00E7cfd reached rate limit. Please try in an hour",
    });
  });

  test("Should throw error if missing timestamp in request", async () => {
    const { signature } = getQueryParams();
    const response = await request(app)
      .get("/score-by-address")
      .query({
        signature,
      })
      .expect(400);
    expect(response.body).toEqual({
      error: "Invalid request, missing parameter",
    });
  });

  test("Should throw error if missing signature in request", async () => {
    const { timestamp } = getQueryParams();
    const response = await request(app)
      .get("/score-by-address")
      .query({
        timestamp,
      })
      .expect(400);
    expect(response.body).toEqual({
      error: "Invalid request, missing parameter",
    });
  });

  test("Should throw error if invalid timestamp", async () => {
    const { timestamp, signature } = getQueryParams();
    const response = await request(app)
      .get("/score-by-address")
      .query({
        timestamp: timestamp - 20 * 60 * 1000,
        signature,
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

const getQueryParams = () => {
  const timestamp = mockedTimestamp - 10 * 1000;
  const signature = UniversalSigner.signStringifiableData(
    timestamp,
    "0xd14d1c078c6219fe2ed6e02c05b4a376f8161a05255611aa8d5e39ee06d0bc4e"
  );
  return { timestamp, signature };
};
