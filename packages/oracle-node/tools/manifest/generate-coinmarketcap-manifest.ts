import { readJSON, saveJSON } from "../common/fs-utils";
import { SINGLE_SOURCE_MANIFESTS_FOLDER } from "../common/paths";
import {
  generateManifest,
  symbolArrToTokensConfig,
} from "../common/manifest-utils";

(() => {
  const avalancheManifest = readJSON(
    "./manifests/data-services/avalanche.json"
  );
  const avalancheEvmManifest = readJSON(
    "./manifests/single-source/avalanche-evm.json"
  );
  const tokens = Object.keys(avalancheManifest.tokens);
  const tokensFromContract = Object.keys(avalancheEvmManifest.tokens);
  const tokensToCMC = tokens.filter(
    (token) => !tokensFromContract.includes(token)
  );
  const manifest = generateManifest({
    tokens: symbolArrToTokensConfig(tokensToCMC),
    defaultSource: ["coinmarketcap"],
  });
  saveJSON(manifest, `${SINGLE_SOURCE_MANIFESTS_FOLDER}/coinmarketcap.json`);
})();
