import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import {
  mockOracleRegistryState,
  mockSigner,
  MOCK_PRIVATE_KEY,
} from "../common/mock-values";
import { connectToTestDB, dropTestDatabase } from "../common/test-db";
import { DataPackage } from "../../src/data-packages/data-packages.model";
import {
  joinSignature,
  keccak256,
  SigningKey,
  toUtf8Bytes,
} from "ethers/lib/utils";

jest.mock("redstone-sdk", () => {
  const originalModule = jest.requireActual("redstone-sdk");
  return {
    __esModule: true,
    ...originalModule,
    getOracleRegistryState: jest.fn(() => mockOracleRegistryState),
  };
});

const signByMockSigner = (message: string): string => {
  const digest = keccak256(toUtf8Bytes(message));
  const signingKey = new SigningKey(MOCK_PRIVATE_KEY);
  const fullSignature = signingKey.signDigest(digest);
  return joinSignature(fullSignature);
};

describe("Data packages (e2e)", () => {
  let app: INestApplication, httpServer: any;

  const testDataPackages = [
    {
      timestampMilliseconds: 1654353400000,
      signature: "mock-signature",
      dataPoints: [
        { dataFeedId: "mock-data-feed-id-1", value: 42 },
        { dataFeedId: "mock-data-feed-id-2", value: 123 },
      ],
    },
  ];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();

    // Connect to mongoDB in memory
    await connectToTestDB();
  });

  afterEach(async () => await dropTestDatabase());

  it("/data-packages/bulk (POST)", async () => {
    const requestSignature = signByMockSigner(JSON.stringify(testDataPackages));
    await request(httpServer)
      .post("/data-packages/bulk")
      .send({
        requestSignature,
        dataPackages: testDataPackages,
      })
      .expect(201);

    const dataPackagesInDB = await DataPackage.find().sort({
      dataFeedId: 1,
    });
    const dataPackagesInDBCleaned = dataPackagesInDB.map((dp) => {
      const { _id, __v, ...rest } = dp.toJSON() as any;
      return rest;
    });
    expect(dataPackagesInDBCleaned).toEqual(
      testDataPackages.map((dataPackage) => ({
        ...dataPackage,
        signerAddress: mockSigner.address,
        dataServiceId: "mock-data-service-1",
      }))
    );
  });

  it("/data-packages/bulk (POST) - should fail for invalid signature", async () => {
    const requestSignature = signByMockSigner(JSON.stringify(testDataPackages));
    const newDataPackages = [...testDataPackages];
    newDataPackages[0].dataPoints[0].value = 43;
    await request(httpServer)
      .post("/data-packages/bulk")
      .send({
        requestSignature,
        testDataPackages,
      })
      .expect(500);

    expect(await DataPackage.find()).toEqual([]);
  });

  it("/data-packages/latest (GET)", async () => {
    const dataPackagesToInsert = [];
    for (const dataServiceId of ["service-1", "service-2", "service-3"]) {
      for (const dataFeedId of [undefined, "ETH", "AAVE", "BTC"]) {
        for (const signerAddress of ["0x1", "0x2", "0x3", "0x4", "0x5"]) {
          dataPackagesToInsert.push({
            ...testDataPackages[0],
            dataFeedId,
            dataServiceId,
            signerAddress,
          });
        }
      }
    }
    await DataPackage.insertMany(dataPackagesToInsert);

    const testResponse = await request(httpServer)
      .get("/data-packages/latest")
      .query({
        "data-service-id": "service-2",
        "unique-signers-count": 4,
        "data-feeds": "ETH,BTC",
      })
      .expect(200);

    for (const dataFeedId of ["BTC", "ETH"]) {
      expect(testResponse.body[dataFeedId].length).toBe(4);
      const signers = [];
      for (const dataPackage of testResponse.body[dataFeedId]) {
        expect(dataPackage).toHaveProperty("dataFeedId", dataFeedId);
        expect(dataPackage).toHaveProperty("sources", null);
        expect(dataPackage).toHaveProperty("signature", "mock-signature");
        signers.push(dataPackage.signerAddress);
      }
      expect(signers.length).toBe(4);
      expect(new Set(signers).size).toBe(4);
    }
  });
});
