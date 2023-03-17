import {
  ContractParamsProvider,
  DataPackagesRequestParams,
} from "redstone-sdk";
import fs from "fs";
import path from "path";

export class ContractParamsProviderMock extends ContractParamsProvider {
  overriddenFeedIds?: string[];

  constructor(private filename: string, dataFeeds: string[]) {
    super({ uniqueSignersCount: 0, dataServiceId: "", dataFeeds });
  }

  protected async requestPayload(
    requestParams: DataPackagesRequestParams
  ): Promise<string> {
    return fs
      .readFileSync(path.join(__dirname, `../sample-data/${this.filename}.hex`))
      .toString();
  }

  getDataFeedIds(): string[] {
    return this.overriddenFeedIds || super.getDataFeedIds();
  }
}
