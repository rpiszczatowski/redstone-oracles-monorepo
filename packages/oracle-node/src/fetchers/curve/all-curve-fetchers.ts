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

for (const [fetcherName, config] of Object.entries(curveFetchersConfig)) {
  for (const [tokenId, tokenConfig] of Object.entries(config)) {
    if (tokenConfig.multiBlockConfig) {
      const curveFetchersMultiBlock = decorateWithMultiBlock(
        new CurveFetcher(
          `${fetcherName}-${tokenId.toLocaleLowerCase()}`,
          config
        ),
        tokenConfig.provider,
        tokenConfig.multiBlockConfig
      );

      curveFetchers[curveFetchersMultiBlock.getName()] =
        curveFetchersMultiBlock;
    }
  }
}

export default curveFetchers;
