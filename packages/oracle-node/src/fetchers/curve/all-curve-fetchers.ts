import { CurveFetcher } from "./CurveFetcher";
import { curveFetchersConfig } from "./curve-fetchers-config";

const curveFetchers: Record<string, CurveFetcher> = {};

for (const [fetcherName, config] of Object.entries(curveFetchersConfig)) {
  curveFetchers[fetcherName] = new CurveFetcher(fetcherName, config);
}

export default curveFetchers;
