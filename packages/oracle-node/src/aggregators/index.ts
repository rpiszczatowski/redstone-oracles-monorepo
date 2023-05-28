import median from "./median-aggregator";
import lwap from "./lwap-aggregator/lwap-aggregator";
import { Aggregator } from "../types";
import { emptyAggregator } from "./empty-aggregator";

export default {
  median,
  lwap,
  empty: emptyAggregator,
} as { [name: string]: Aggregator };
