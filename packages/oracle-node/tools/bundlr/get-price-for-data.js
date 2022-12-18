const prompts = require("prompts");
const { default: Bundlr } = require("@bundlr-network/client");
const bundlrDefaults = require("../../src/arweave/bundlr-defaults.json");

main();

async function main() {
  // Prompt bytesCount
  const { bytesCount } = await prompts({
    type: "number",
    name: "bytesCount",
    message: "Enter bytes count",
  });

  // Create bundlr instance
  const bundlr = new Bundlr(
    bundlrDefaults.defaultUrl,
    bundlrDefaults.defaultCurrency
  );

  // Get balance
  const cost = await bundlr.getPrice(bytesCount);
  const costAR = bigNumberToHumanReadableNumber(cost);
  const arValue = 0;
  const costUSD = arValue * costAR;

  // Print balance
  console.log(`Cost for ${bytesCount} bytes: ${costAR} AR ($${costUSD})`);
}

function bigNumberToHumanReadableNumber(amount) {
  return amount.div(1e12).toNumber();
}
