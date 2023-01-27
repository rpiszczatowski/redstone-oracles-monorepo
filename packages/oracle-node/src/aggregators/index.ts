import median from "./median-aggregator";
import lwap from "./lwap-aggregator";
import { Aggregator } from "../types";

export default {
  median,
  lwap,
} as { [name: string]: Aggregator };
