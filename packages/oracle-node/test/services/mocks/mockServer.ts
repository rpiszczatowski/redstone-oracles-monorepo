import { rest } from "msw";
import { setupServer } from "msw/node";
import devManifest from "../../../manifests/dev/dev.json";
import { Manifest } from "../../../src/types";

export const mockOracleRegistryState = {
  state: {
    nodes: {
      nodeId: {
        dataServiceId: "testDataServiceId",
        evmAddress: "0x19E7E376E7C213B7E7e7e46cc70A5dD086DAff2A",
      },
    },
    dataServices: {
      testDataServiceId: {
        manifestTxId: "mockManifestTxId",
      },
    },
  },
};

export const devManifestWithTxId: Manifest = {
  ...devManifest,
  txId: "mockManifestTxId",
};

const validHandlers = [
  rest.get("https://dre-1.warp.cc/contract", (_, res, ctx) =>
    res(ctx.json(mockOracleRegistryState))
  ),
  rest.get("https://arweave.net/mockManifestTxId", (_, res, ctx) =>
    res(ctx.json(devManifest))
  ),
];

export const invalidHandler = rest.get(
  "https://arweave.net/mockManifestTxId",
  (_, res, ctx) => res(ctx.status(400))
);

export const bigDelayHandler = rest.get(
  "https://arweave.net/mockManifestTxId",
  (_, res, ctx) => res(ctx.delay(10), ctx.json(devManifest))
);

export const server = setupServer(...validHandlers);
