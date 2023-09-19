import { ConsolaLogObject, LogLevel } from "consola";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";

export class ConsolaErrorReporter {
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  log(logObj: ConsolaLogObject) {
    const levels = {
      [LogLevel.Error]: "ERROR",
      [LogLevel.Warn]: "WARNING",
    };

    const level = logObj.level;

    if (level && level <= LogLevel.Warn) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      reportError({
        error: JSON.stringify(logObj.args),
        errorTitle: `${levels[level as 0 | 1]}-${logObj.tag}`,
      });
    }
  }
}

export function reportError(args: { error: string; errorTitle: string }) {
  if (!config.enablePerformanceTracking) {
    return;
  }

  const errorId = uuidv4();
  try {
    console.log(`Reporting an error ${errorId}`, JSON.stringify(args));
    // We will implement error reporting using grafana instead
    console.log(`Error reported ${errorId}`);
  } catch (e) {
    console.error(
      `Error occurred during error reporting ${errorId}`,
      (e as Error).stack
    );
  }
}
