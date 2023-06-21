import { Type } from "class-transformer";
import {
  IsEnum,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
} from "class-validator";
import {
  DataPointPlainObj,
  IStandardDataPoint,
  SignedDataPackagePlainObj,
} from "redstone-protocol";
import { IsNumberOrString } from "../utils/IsNumberOrString";
import { CachedDataPackage } from "./data-packages.model";

export class ReceivedDataPackage implements SignedDataPackagePlainObj {
  @IsString()
  signature: string;

  @ValidateNested({ each: true })
  @Type(() => ReceivedDataPoint)
  dataPoints: DataPointPlainObj[];

  @IsString()
  timestampMilliseconds: number;

  @IsOptional()
  sources?: Record<string, string | number>;
}

export class ReceivedDataPoint implements IStandardDataPoint {
  @IsString()
  dataFeedId: string;

  @Validate(IsNumberOrString)
  value: string;
}

export class BulkPostRequestBody {
  @IsString()
  requestSignature: string;

  @ValidateNested({ each: true })
  dataPackages: ReceivedDataPackage[];
}

export type ResponseFormat = "raw" | "hex" | "bytes" | "json";

export class GetLatestDataPackagesQuery {
  @IsString()
  "data-service-id": string;

  @IsString()
  "unique-signers-count": string;

  @IsString()
  @IsOptional()
  "data-feeds"?: string;

  @IsOptional()
  @IsEnum(["raw", "hex", "bytes", "json"])
  format?: ResponseFormat;
}

export class GetDataPackagesStatsQuery {
  @IsString()
  "from-timestamp": string;

  @IsOptional()
  @IsString()
  "to-timestamp"?: string;

  @IsString()
  "api-key": string;
}

export interface DataPackagesResponse {
  [dataFeedId: string]: CachedDataPackage[];
}

export interface DataPackagesStatsResponse {
  [signerAddress: string]: {
    dataPackagesCount: number;
    verifiedDataPackagesCount: number;
    verifiedDataPackagesPercentage: number;
    nodeName: string;
    dataServiceId: string;
  };
}
