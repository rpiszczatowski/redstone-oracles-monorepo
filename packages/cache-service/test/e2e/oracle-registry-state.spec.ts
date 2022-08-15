import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import redstoneSDK from "redstone-sdk";
import { mockOracleRegistryState } from "../common/mock-values";

jest.mock("redstone-sdk");

describe("Oracle registry state (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("/oracle-registry-state (GET)", async () => {
    const mockedRedstoneSDK = redstoneSDK as jest.Mocked<typeof redstoneSDK>;
    mockedRedstoneSDK.getOracleRegistryState.mockResolvedValue(
      mockOracleRegistryState
    );

    const testResponse = await request(app.getHttpServer())
      .get("/oracle-registry-state")
      .expect(200);

    expect(testResponse.body).toEqual(mockOracleRegistryState);
  });
});
