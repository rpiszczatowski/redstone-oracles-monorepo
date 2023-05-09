import { Contract } from "ethers";
import { DataPackagesRequestParams, DataPackagesResponse } from "redstone-sdk";
import { ScoreType } from "redstone-protocol";
import { MockDataPackageConfig, MockWrapper } from "./wrappers/MockWrapper";
import {
  MockMultiSignDataPackageConfig,
  MockWrapperMultiSign,
} from "./wrappers/MockWrapperMultiSign";
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
    ).overwriteEthersContract(this.baseContract);
  }

  usingMockDataPackages(mockDataPackages: MockDataPackageConfig[]) {
    return new MockWrapper(mockDataPackages).overwriteEthersContract(
      this.baseContract
    );
  }

  usingMockMultiSignDataPackage(
    mockDataPackage: MockMultiSignDataPackageConfig
  ) {
    return new MockWrapperMultiSign(mockDataPackage).overwriteEthersContract(
      this.baseContract
    );
  }

  usingSimpleNumericMock(simpleNumericMockConfig: SimpleNumericMockConfig) {
    return new SimpleNumericMockWrapper(
      simpleNumericMockConfig
    ).overwriteEthersContract(this.baseContract);
  }

  usingOnDemandRequest(nodeUrls: string[], scoreType: ScoreType) {
    return new OnDemandRequestWrapper(
      {
        signer: this.baseContract.signer,
        scoreType,
      },
      nodeUrls
    ).overwriteEthersContract(this.baseContract);
  }

  usingDataPackages(dataPackages: DataPackagesResponse) {
    return new DataPackagesWrapper(dataPackages).overwriteEthersContract(
      this.baseContract
    );
  }
}
