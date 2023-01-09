const fs = require("fs");
const sources = require("../../src/config/sources.json");

(() => {
  const sourceCopy = { ...sources };
  const sortedSourcesNames = Object.keys(sources).sort();
  const sourcesToSave = sortedSourcesNames.reduce(
    (sources, currentSourceName) => {
      const currentSource = sourceCopy[currentSourceName];
      return { ...sources, ...{ [currentSourceName]: currentSource } };
    },
    {}
  );
  fs.writeFileSync(
    "src/config/sources.json",
    JSON.stringify(sourcesToSave, null, 2) + "\n"
  );
})();
