import {
  ContractParamsProvider,
  DataPackagesRequestParams,
} from "@redstone-finance/sdk";

export class StarknetContractParamsProvider extends ContractParamsProvider {
  protected override async requestPayload(
    requestParams: DataPackagesRequestParams
  ): Promise<string> {
    let changedRequestParams = { ...requestParams };
    changedRequestParams["dataFeeds"] = undefined;

    return await super.requestPayload(changedRequestParams);
  }
}
