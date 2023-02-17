import { Contract } from "ethers";
import { DataPackagesRequestParams, DataPackagesResponse } from "redstone-sdk";
import { ScoreType } from "redstone-protocol";
import { MockDataPackageConfig, MockWrapper } from "./wrappers/MockWrapper";
import { DataServiceWrapper } from "./wrappers/DataServiceWrapper";
import {
  SimpleNumericMockConfig,
  SimpleNumericMockWrapper,
} from "./wrappers/SimpleMockNumericWrapper";
import { OnDemandRequestWrapper } from "./wrappers/OnDemandRequestWrapper";
import { DataPackagesWrapper } from "./wrappers/DataPackagesWrapper";

export class WrapperBuilder {
  constructor(private baseContract: Contract) {}

  static wrap(contract: Contract): WrapperBuilder {
    return new WrapperBuilder(contract);
  }

  usingDataService(
    dataPackagesRequestParams: DataPackagesRequestParams,
    urls: string[]
  ): Contract {
    return new DataServiceWrapper(
      dataPackagesRequestParams,
      urls
    ).useSignerInsteadOfProviderForStaticCalls(this.baseContract);
  }

  usingMockDataPackages(mockDataPackages: MockDataPackageConfig[]) {
    return new MockWrapper(
      mockDataPackages
    ).useSignerInsteadOfProviderForStaticCalls(this.baseContract);
  }

  usingSimpleNumericMock(simpleNumericMockConfig: SimpleNumericMockConfig) {
    return new SimpleNumericMockWrapper(
      simpleNumericMockConfig
    ).useSignerInsteadOfProviderForStaticCalls(this.baseContract);
  }

  usingOnDemandRequest(nodeUrls: string[], scoreType: ScoreType) {
    return new OnDemandRequestWrapper(
      {
        signer: this.baseContract.signer,
        scoreType,
      },
      nodeUrls
    ).useSignerInsteadOfProviderForStaticCalls(this.baseContract, true);
  }

  usingDataPackages(dataPackages: DataPackagesResponse) {
    return new DataPackagesWrapper(
      dataPackages
    ).useSignerInsteadOfProviderForStaticCalls(this.baseContract);
  }
}
