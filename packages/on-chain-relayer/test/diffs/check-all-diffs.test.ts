import childProcess from "child_process";
import fs from "fs";
import path from "path";
import util from "util";
import assert from "assert";

const exec = util.promisify(childProcess.exec);

// Sometimes we need to copy some code from one contract to another
// We would like to minimise chances of invalid copying and improve code
// review process of changes like this, so instead of reviewing new files
// we can focus on reviewing the diffs
describe("Check all diffs", () => {
  // Dynamically get folders under the 'tests/diffs' directory
  const diffTestFolders = fs
    .readdirSync(path.resolve(__dirname))
    .filter((file) => fs.statSync(path.join(__dirname, file)).isDirectory());

  for (const folderName of diffTestFolders) {
    it(`Diff check for ${folderName}`, async () => {
      const configPath = path.resolve(__dirname, folderName, "paths.json");
      const expectedDiffPath = path.resolve(
        __dirname,
        folderName,
        "expected-diff.patch"
      );
      const actualDiffPath = path.resolve(
        __dirname,
        folderName,
        "actual-diff.patch"
      );

      if (!fs.existsSync(configPath) || !fs.existsSync(expectedDiffPath)) {
        throw new Error(
          `Missing paths.json or expected-diff.patch in folder ${folderName}`
        );
      }

      // Parse config.json
      const configContent = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const { filePath1, filePath2 } = configContent;

      // TODO: improve this code
      // Generate actual diff
      let actualDiff = "";
      try {
        await exec(`diff ${filePath1} ${filePath2}`);
      } catch (error) {
        if (error.code === 1) {
          // This means the files are different, not that an error occurred
          actualDiff = error.stdout;
        } else {
          // This means an actual error occurred (e.g., one of the files doesn't exist)
          throw error;
        }
      }

      // Read expected diff
      const expectedDiff = fs.readFileSync(expectedDiffPath, "utf8");

      // // Compare diffs
      // assert.strictEqual(
      //   actualDiff,
      //   expectedDiff,
      //   `Diff does not match for folder ${folderName}`
      // );

      if (actualDiff !== expectedDiff) {
        fs.writeFileSync(actualDiffPath, actualDiff, "utf8");
        assert.fail(
          `Diff does not match for folder ${folderName}. Actual diff has been written to ${actualDiffPath}`
        );
      }
    });
  }
});
