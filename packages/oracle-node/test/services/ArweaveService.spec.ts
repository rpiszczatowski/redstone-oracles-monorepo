import ArweaveService from "../../src/arweave/ArweaveService";
import {
  bigDelayHandler,
  devManifestWithTxId,
  invalidHandler,
  server,
} from "./mocks/mockServer";

const TEST_TIMEOUT_MS = 5;

describe("ArweaveService - getCurrentManifest", () => {
  let arweaveService: ArweaveService;

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  beforeEach(() => {
    arweaveService = new ArweaveService(TEST_TIMEOUT_MS);
  });

  test("Should fetch current manifest", async () => {
    const manifest = await arweaveService.getCurrentManifest();
    expect(manifest).toEqual(devManifestWithTxId);
  });

  test("Fetching failed, old manifest doesn't exist", async () => {
    server.use(invalidHandler);
    await expect(arweaveService.getCurrentManifest()).rejects.toThrowError(
      "Cannot fetch new manifest and old manifest doesn't exist"
    );
  });

  test("Fetching failed, old manifest exists", async () => {
    server.use(invalidHandler);
    const manifest =
      await arweaveService.getCurrentManifest(devManifestWithTxId);
    expect(manifest).toEqual(devManifestWithTxId);
  });

  test("Fetching failed with timeout, old manifest doesn't exist", async () => {
    server.use(bigDelayHandler);
    await expect(arweaveService.getCurrentManifest()).rejects.toThrowError(
      "Cannot fetch new manifest and old manifest doesn't exist"
    );
  });

  test("Fetching failed with timeout, old manifest exists", async () => {
    server.use(bigDelayHandler);
    const manifest =
      await arweaveService.getCurrentManifest(devManifestWithTxId);
    expect(manifest).toEqual(devManifestWithTxId);
  });
});
