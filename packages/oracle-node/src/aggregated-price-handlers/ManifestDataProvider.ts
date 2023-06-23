import { Manifest, TokensConfig } from "../types";
import ManifestHelper from "../manifest/ManifestHelper";

// Our mechanism for auto-updating manifests can be improved, which will
// allow us to get rid of classed like this. We can create a separate global
// module, which will store a mapping from iterationId to the used manifest,
// but only for active iterations
export class ManifestDataProvider {
  latestManifest?: Manifest;
  allTokensConfig?: TokensConfig;

  handleManifest(manifest: Manifest) {
    this.latestManifest = manifest;
    this.allTokensConfig = ManifestHelper.getAllTokensConfig(manifest);
  }
}
