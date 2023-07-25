import { DexOnChainFetcher } from "../dex-on-chain/DexOnChainFetcher";
import { decorateWithMultiBlock } from "../MultiBlockDecorator";
import { curveFetchersConfig } from "./curve-fetchers-config";
import { CurveFetcher, CurveFetcherResponse } from "./CurveFetcher";

const curveFetchers: Record<
  string,
  DexOnChainFetcher<CurveFetcherResponse>
> = {};

for (const [fetcherName, config] of Object.entries(curveFetchersConfig)) {
  curveFetchers[fetcherName] = new CurveFetcher(fetcherName, config);
}

for (const [lpName, config] of Object.entries(curveFetchersConfig)) {
  const multiBlockConfig = config[lpName].multiBlockConfig;
  if (multiBlockConfig) {
    const curveFetchersMultiBlock = decorateWithMultiBlock(
      new CurveFetcher(lpName, config),
      config[lpName].provider,
      multiBlockConfig
    );

    curveFetchers[curveFetchersMultiBlock.getName()] = curveFetchersMultiBlock;
  }
}

export default curveFetchers;
