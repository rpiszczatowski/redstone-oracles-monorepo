import fs from "fs";

interface ParsedLogMessage {
  type: string;
}

const LOGS_FILE = "./tmp.out";

main();

async function main() {
  const logs = fs.readFileSync(LOGS_FILE, "utf8");
  const logLines = logs.split("\n");

  const errors: ParsedLogMessage[] = [];
  const warnings: ParsedLogMessage[] = [];
  for (const logLine of logLines) {
    try {
      const parsedMessage = JSON.parse(logLine) as ParsedLogMessage;
      if (parsedMessage.type === "warn") {
        warnings.push(parsedMessage);
      }
      if (parsedMessage.type === "error") {
        errors.push(parsedMessage);
      }
    } catch (e) {
      console.warn(`Failed to parse log line: "${logLine}"`);
    }
  }

  console.log(
    JSON.stringify(
      { errors: errors.length, warnings: warnings.length },
      null,
      2
    )
  );
}
