import fs from "fs";
import { readJSON } from "../common/fs-utils";
import { SINGLE_SOURCE_MANIFESTS_FOLDER } from "../common/paths";
import { Manifest, TokensConfig } from "../../src/types";
import fetchers from "../../src/fetchers";

(async () => {
  const manifests = readSingleSourceManifests();

  const tokens: TokensConfig = {};
  for (const sourceManifest of manifests) {
    const sourceId = sourceManifest!.defaultSource![0];
    if (sourceId.includes("-evm-fetcher")) {
      continue;
    }
    const fetcher = fetchers[sourceId];
    const tokens = sourceManifest.tokens;

    try {
      console.log(`Fetching tokens values for ${sourceId}...`);
      await fetcher!.fetchAll(Object.keys(tokens));
    } catch (error) {
      console.log(error);
    }
  }
})();

function readSingleSourceManifests() {
  const manifests: Manifest[] = [];
  const files = fs.readdirSync(SINGLE_SOURCE_MANIFESTS_FOLDER);

  for (const fileName of files) {
    const manifest = readJSON(`${SINGLE_SOURCE_MANIFESTS_FOLDER}/${fileName}`);
    manifests.push(manifest);
  }

  return manifests;
}
