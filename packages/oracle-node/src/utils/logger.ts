import consola, { JSONReporter, FancyReporter } from "consola";
import { config } from "../config";
import { ConsolaErrorReporter } from "./error-reporter";

export default (moduleName: string) => {
  // Currently we can set reporters using env variables
  const { enableJsonLogs } = config;
  const mainReporter = enableJsonLogs
    ? new JSONReporter()
    : new FancyReporter();

  return consola
    .create({
      // Here we can pass additional options for logger configuration

      // level: 4
      reporters: [mainReporter, new ConsolaErrorReporter()],
    })
    .withTag(moduleName);
};
