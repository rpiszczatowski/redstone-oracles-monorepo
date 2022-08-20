import ArweaveService from "../../src/arweave/ArweaveService";
import {
  validMockArProxy,
  invalidMockArProxy,
  oldManifestMock,
  manifestUsingDenMock,
  manifestUsingGatewayMock,
} from "./mocks/mocks";
import {
  invalidArweaveHandlers,
  invalidDenHandlers,
  server,
  timeoutArweaveHandlers,
  timeoutDenHandlers,
} from "./mocks/mockServer";

// TODO: refactor these tests

jest.mock("../../src/arweave/ArweaveProxy", () => {
  return jest.fn().mockImplementation(() => validMockArProxy);
});

const TEST_TIMEOUT_MS = 5;

describe("ArweaveService - getCurrentManifest", () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  // test("Should fetch current manifest", async () => {
  //   const arweaveService = new ArweaveService();
  //   const manifest = await arweaveService.getCurrentManifest();
  //   expect(manifest).toEqual(manifestUsingDenMock);
  // });

  // test("Oracle registry fetching failed, old manifest doesn't exist", async () => {
  //   jest.mock("../../src/arweave/ArweaveProxy", () => {
  //     return jest.fn().mockImplementation(() => invalidMockArProxy);
  //   });
  //   server.use(...invalidDenHandlers);
  //   const arweaveService = new ArweaveService();
  //   await expect(arweaveService.getCurrentManifest()).rejects.toThrowError(
  //     "Cannot fetch new manifest and old manifest doesn't exist"
  //   );
  //   jest.mock("../../src/arweave/ArweaveProxy", () => {
  //     return jest.fn().mockImplementation(() => validMockArProxy);
  //   });
  // });

  // test("Oracle registry fetching failed, old manifest exists", async () => {
  //   jest.mock("../../src/arweave/ArweaveProxy", () => {
  //     return jest.fn().mockImplementation(() => invalidMockArProxy);
  //   });
  //   server.use(...invalidDenHandlers);
  //   const arweaveService = new ArweaveService();
  //   const manifest = await arweaveService.getCurrentManifest(oldManifestMock);
  //   expect(manifest).toEqual(oldManifestMock);
  //   jest.mock("../../src/arweave/ArweaveProxy", () => {
  //     return jest.fn().mockImplementation(() => validMockArProxy);
  //   });
  // });

  // test("Oracle registry fetched by DEN, fetching manifest failed, old manifest exists", async () => {
  //   server.use(...invalidArweaveHandlers);
  //   const arweaveService = new ArweaveService();
  //   const manifest = await arweaveService.getCurrentManifest(oldManifestMock);
  //   expect(manifest).toEqual(oldManifestMock);
  // });

  // test("Oracle registry fetched by DEN, fetching manifest timeout, old manifest exists", async () => {
  //   server.use(...timeoutArweaveHandlers);
  //   const arweaveService = new ArweaveService(TEST_TIMEOUT_MS);
  //   const manifest = await arweaveService.getCurrentManifest(oldManifestMock);
  //   expect(manifest).toEqual(oldManifestMock);
  // });

  // test("Oracle registry fetched by DEN, fetching manifest failed, old manifest doesn't exist", async () => {
  //   server.use(...invalidArweaveHandlers);
  //   const arweaveService = new ArweaveService();
  //   await expect(arweaveService.getCurrentManifest()).rejects.toThrowError(
  //     "Cannot fetch new manifest and old manifest doesn't exist"
  //   );
  // });
});
