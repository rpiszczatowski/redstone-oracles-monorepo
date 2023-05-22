import { CurveFetcher, CurveFetcherResponse } from "./CurveFetcher";
import { curveFetchersConfig } from "./curve-fetchers-config";
import { MultiBlockCurveFetcher } from "./MultiBlockCurveFetcher";
import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";

const curveFetchers: Record<
  string,
  DexOnChainFetcher<CurveFetcherResponse>
> = {};

for (const [fetcherName, config] of Object.entries(curveFetchersConfig)) {
  curveFetchers[fetcherName] = new CurveFetcher(fetcherName, config);
}

for (const [lpName, config] of Object.entries(curveFetchersConfig)) {
  const fetcherName = `${lpName}-multi-block`;

  const hasTokenConfiguredMultiBlock = Object.values(config).every(
    (poolConfig) => poolConfig.multiBlockConfig
  );
  if (hasTokenConfiguredMultiBlock) {
    curveFetchers[fetcherName] = new MultiBlockCurveFetcher(
      fetcherName,
      curveFetchers[lpName] as CurveFetcher
    );
  }
}

export default curveFetchers;
