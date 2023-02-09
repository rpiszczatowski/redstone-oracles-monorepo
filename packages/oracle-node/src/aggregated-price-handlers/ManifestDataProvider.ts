import {Manifest} from "../types";
import ManifestHelper from "../manifest/ManifestHelper";

export class ManifestDataProvider {
    allTokenCount?: number

    handleManifest(manifest: Manifest) {
      this.allTokenCount = ManifestHelper.getAllTokensCount(manifest);
  }
}
