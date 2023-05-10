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

for (const [lpName] of Object.entries(curveFetchersConfig)) {
  const fetcherName = `multi-block-${lpName}`;
  curveFetchers[fetcherName] = new MultiBlockCurveFetcher(
    fetcherName,
    curveFetchers[lpName] as CurveFetcher
  );
}

export default curveFetchers;
