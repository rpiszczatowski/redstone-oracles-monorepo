import fs from "fs";

interface ParsedLogLine {
  type: string;
  args: string[];
}

interface Counters {
  [key: string]: number;
}

type MessageDetails =
  | {
      type: "fetching-failed";
      failedSource: string;
    }
  | { type: "not-included-in-response"; sourceName: string; id: string }
  | { type: "no-valid-values-for-symbol"; symbol: string }
  | { type: "fetch-success"; symbol: string }
  | { type: "other" };

const LOGS_FILE = "./tmp.out";
const FETCHNIG_FAILED_REGEX = /Fetching failed for source: (.*):/;
const NOT_IN_RESPONSE_REGEX = /Id (.*) is not included in response for: (.*)/;
const NO_VALID_VALUES_REGEX = /No valid values for symbol: (.*)\n/;
const FETCH_SUCCESS_REGEX = /Fetched price : (.*) :/;

main();

async function main() {
  const logs = fs.readFileSync(LOGS_FILE, "utf8");
  const logLines = logs.split("\n");

  const levels: Counters = {};
  const failedSources: Counters = {};
  const notIncludedInResponse: { [sourceName: string]: Counters } = {};
  const noValidValuesForSymbols: Counters = {};
  const fetchSuccessSymbols: Counters = {};
  for (const logLine of logLines) {
    try {
      const parsedMessage = JSON.parse(logLine) as ParsedLogLine;
      const messageDetails = analyzeLogMessage(parsedMessage);

      // Checking message details
      switch (messageDetails.type) {
        case "fetching-failed": {
          safelyIncrement(failedSources, messageDetails.failedSource);
          break;
        }
        case "not-included-in-response": {
          const { sourceName, id } = messageDetails;
          if (!notIncludedInResponse[sourceName]) {
            notIncludedInResponse[sourceName] = {};
          }
          safelyIncrement(notIncludedInResponse[sourceName], id);
          break;
        }
        case "no-valid-values-for-symbol": {
          safelyIncrement(noValidValuesForSymbols, messageDetails.symbol);
          break;
        }
        case "fetch-success": {
          safelyIncrement(fetchSuccessSymbols, messageDetails.symbol);
          break;
        }
      }

      // Counting types
      safelyIncrement(levels, parsedMessage.type);
    } catch (e) {}
  }

  const finalReport = {
    levels,
    failedSources,
    notIncludedInResponse,
    noValidValuesForSymbols: Object.keys(noValidValuesForSymbols).length,
    fetchSuccessSymbols: Object.keys(fetchSuccessSymbols).length,
  };

  console.log(JSON.stringify(finalReport, null, 2));
}

function safelyIncrement(obj: Counters, key: string) {
  obj[key] = (obj[key] || 0) + 1;
}

function analyzeLogMessage(logLine: ParsedLogLine): MessageDetails {
  const message = logLine.args[0] || "";

  if (FETCHNIG_FAILED_REGEX.test(message)) {
    const failedSource = FETCHNIG_FAILED_REGEX.exec(message)![1];
    return {
      type: "fetching-failed",
      failedSource,
    };
  } else if (NOT_IN_RESPONSE_REGEX.test(message)) {
    const parsedRegex = NOT_IN_RESPONSE_REGEX.exec(message)!;
    return {
      type: "not-included-in-response",
      id: parsedRegex[1],
      sourceName: parsedRegex[2],
    };
  } else if (NO_VALID_VALUES_REGEX.test(message)) {
    const parsedRegex = NO_VALID_VALUES_REGEX.exec(message)!;
    return {
      type: "no-valid-values-for-symbol",
      symbol: parsedRegex[1],
    };
  } else if (FETCH_SUCCESS_REGEX.test(message)) {
    const parsedRegex = FETCH_SUCCESS_REGEX.exec(message)!;
    return {
      type: "fetch-success",
      symbol: parsedRegex[1],
    };
  } else {
    return {
      type: "other",
    };
  }
}
