import { Consola } from "consola";
const logger = require("./utils/logger")("Terminator") as Consola;

enum ExitCodes {
  ManifestConfigError = 1,
}

export function terminateWithManifestConfigError(errorDetails: string): never {
  logger.fatal(
    `Manifest configuration error: ${errorDetails}.\n` +
      `Terminating with exit code ${ExitCodes.ManifestConfigError}`
  );

  process.exit(ExitCodes.ManifestConfigError);
}
