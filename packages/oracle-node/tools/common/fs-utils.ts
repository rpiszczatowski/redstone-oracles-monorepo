import fs from "fs";

export const readJSON = (path: string, defaultValue?: any): any => {
  try {
    const data = fs.readFileSync(path, { encoding: "utf8" });
    return JSON.parse(data);
  } catch (e) {
    if (defaultValue === undefined) {
      throw e;
    } else {
      return defaultValue;
    }
  }
};

export const saveJSON = (obj: any, path: string) => {
  console.log(`Saving prettified json to: ${path}`);
  const content = JSON.stringify(obj, null, 2) + "\n";
  fs.writeFileSync(path, content);
};
