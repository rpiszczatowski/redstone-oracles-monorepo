import oldMainManifest from "../../manifests/data-services/main.json";
import mainWideSupportManifest from "../../manifests/dev/main-wide-support.json";
import { saveJSON } from "../common/fs-utils";

interface LongTailTokens {
  [tokenName: string]: { source: string[] };
}

(() => {
  const oldManifestTokens = Object.keys(oldMainManifest.tokens);
  const mainWideSupportTokens = Object.keys(mainWideSupportManifest.tokens);

  let longTailTokensCounter = 0;
  const longTailTokens: LongTailTokens = {};
  for (const token of oldManifestTokens) {
    if (!mainWideSupportTokens.includes(token)) {
      longTailTokens[token] = { source: ["coingecko"] };
      longTailTokensCounter += 1;
    }
  }

  console.log(`Old main manifest tokens count - ${oldManifestTokens.length}`);
  console.log(
    `Main wide support manifest tokens count - ${mainWideSupportTokens.length}`
  );
  console.log(`Found ${longTailTokensCounter} long tail tokens`);

  const manifest = { ...mainWideSupportManifest };
  manifest.tokens = { ...manifest.tokens, ...longTailTokens };

  saveJSON(manifest, "./manifests/data-services/main.json");
})();
