import median from "./median-aggregator";
import allEqual from "./all-equal-aggregtor";
import { Aggregator } from "../types";

export default {
  median,
  allEqual
} as { [name: string]: Aggregator };
