import { Contract } from "ethers";
import { DataPackagesRequestParams } from "redstone-sdk";
import { MockDataPackageConfig, MockWrapper } from "./wrappers/MockWrapper";
import { DataServiceWrapper } from "./wrappers/DataServiceWrapper";
import {
  SimpleNumericMockConfig,
  SimpleNumericMockWrapper,
} from "./wrappers/SimpleMockNumericWrapper";
import { OnDemandRequestParams, OnDemandRequestWrapper } from "./wrappers/OnDemandRequestWrapper";

export class WrapperBuilder {
  constructor(private baseContract: Contract) { }

  static wrap(contract: Contract): WrapperBuilder {
    return new WrapperBuilder(contract);
  }

  usingDataService(
    dataPackagesRequestParams: DataPackagesRequestParams,
    urls?: string[]
  ): Contract {
    return new DataServiceWrapper(
      dataPackagesRequestParams,
      urls
    ).overwriteEthersContract(this.baseContract);
  }

  usingMockDataPackages(mockDataPackages: MockDataPackageConfig[]) {
    return new MockWrapper(mockDataPackages).overwriteEthersContract(
      this.baseContract
    );
  }

  usingSimpleNumericMock(simpleNumericMockConfig: SimpleNumericMockConfig) {
    return new SimpleNumericMockWrapper(
      simpleNumericMockConfig
    ).overwriteEthersContract(this.baseContract);
  }

  usingOnDemandRequest(nodeUrls: string[], params: OnDemandRequestParams) {
    return new OnDemandRequestWrapper(
      this.baseContract.signer,
      params,
      nodeUrls
    ).overwriteEthersContract(this.baseContract);
  }
}
