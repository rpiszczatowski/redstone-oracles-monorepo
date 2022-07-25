import request from "supertest";
import axios from "axios";
import { toBase64 } from "../../src/utils/base64";
import { getApp } from "./_helpers";

const app = getApp();

// Mock axios response
const exampleResponse = {
  A: {
    B: {
      C: 42,
    },
  },
};
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.get.mockResolvedValue({ data: exampleResponse });

// Mock current timestamp
Date.now = jest.fn(() => 1652662184000);

describe("Custom URL requests route", () => {
  test("Should send correct response ", async () => {
    const customUrlRequestConfigBase64 = toBase64(
      JSON.stringify({
        url: "https://example-custom-data-source.com/hehe",
        jsonpath: "$.A.B.C",
      })
    );
    const response = await request(app)
      .get("/custom-url-requests")
      .query({
        "custom-url-request-config-base64": customUrlRequestConfigBase64,
      })
      .expect(200);

    expect(response.body).toEqual({
      signerAddress: "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A",
      signature:
        "0x0247ad69853e7693afec915122a32a687cc7553d443548075fa365d2d36410ab2c2476f65df6ada00e61370394316315803b2d48d7f4d20d6b960338a9279cd61b",
      prices: [{ symbol: "0x8edd634f1bbd8320", value: 42 }],
      customRequestConfig: {
        url: "https://example-custom-data-source.com/hehe",
        jsonpath: "$.A.B.C",
      },
      timestamp: 1652662184000,
    });
  });

  test("Should handle invalid values correctly ", async () => {
    mockedAxios.get.mockResolvedValue({ data: { bad: "value" } });
    const customUrlRequestConfigBase64 = toBase64(
      JSON.stringify({
        url: "https://example-custom-data-source.com/hehe",
        jsonpath: "$.A.B.C",
      })
    );
    await request(app)
      .get("/custom-url-requests")
      .query({
        "custom-url-request-config-base64": customUrlRequestConfigBase64,
      })
      .expect(400);
  });

  test("Should handle invalid request params ", async () => {
    mockedAxios.get.mockResolvedValue({ data: { bad: "value" } });
    await request(app).get("/custom-url-requests").expect(400);
  });
});
