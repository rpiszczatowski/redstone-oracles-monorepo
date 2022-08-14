import mongoose from "mongoose";
import { CachedDataPackage } from "./data-packages.interface";

const { Types } = mongoose.Schema;

const DataPackageSchema = new mongoose.Schema<CachedDataPackage>({
  timestampMilliseconds: {
    type: Types.Number,
    required: true,
  },
  signature: {
    type: Types.String,
    required: true,
  },
  dataPoints: {
    type: Types.Mixed,
    required: true,
  },

  dataServiceId: {
    type: Types.String,
    required: true,
  },
  signerAddress: {
    type: Types.String,
    required: true,
  },
  dataFeedId: {
    type: Types.String,
    required: false,
  },
  sources: {
    type: Types.Mixed,
    required: false,
  },
});

export const DataPackage = mongoose.model("DataPackage", DataPackageSchema);
