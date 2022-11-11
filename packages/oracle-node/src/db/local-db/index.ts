import { Level } from "level";
import { config } from "../../config";

export const db = new Level(config.levelDbLocation, {
  keyEncoding: "utf8",
  valueEncoding: "json",
});

export default db;
