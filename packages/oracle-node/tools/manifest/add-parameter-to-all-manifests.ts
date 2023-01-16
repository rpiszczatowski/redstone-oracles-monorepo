import fs from "fs";
import { readJSON, saveJSON } from "../common/fs-utils";
import {
  SINGLE_SOURCE_MANIFESTS_FOLDER,
  DATA_SERVICES_MANIFESTS_FOLDER,
  DEV_MANIFESTS_FOLDER,
} from "../common/paths";

(() => {
  const parameter = {};
  const folders = [
    SINGLE_SOURCE_MANIFESTS_FOLDER,
    DATA_SERVICES_MANIFESTS_FOLDER,
    DEV_MANIFESTS_FOLDER,
  ];
  for (const folder of folders) {
    const files = fs.readdirSync(folder);

    for (const fileName of files) {
      const manifest = readJSON(`${folder}/${fileName}`);
      const { tokens, ...manifestWithoutTokens } = manifest;
      const updatedManifest = {
        ...manifestWithoutTokens,
        ...parameter,
        tokens,
      };
      saveJSON(updatedManifest, `${folder}/${fileName}`);
    }
  }
})();
