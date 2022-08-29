# Tools

The oracle-node package contains the tools folder with several helpful Node.js scripts.

## Usage

Tools that are written in typescript and can be executed with `yarn run-ts PATH_TO_THE_SCRIPT_FILE`

## Instructions

### Add more tokens from coingecko source

```sh
$ yarn run-ts tools/coingecko/update-coingecko-configs.ts
$ yarn run-ts tools/coingecko/add-new-tokens-to-coingecko-manifest.ts
$ yarn run-ts tools/manifest/generate-main-manifest.ts
```

## Most useful scripts

<!-- The table below was generated using: https://www.tablesgenerator.com/markdown_tables -->

| File                                                    | What it does                                                                                                                                                                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tools/manifest/generate-main-manifest.ts                | It generates (or updates) [ main manifest ](/manifests/data-services/main.json), aggregating all tokens and sources from [ all single sources manifests ](/manifests/single-source)                                                    |
| tools/coingecko/update-coingecko-configs.ts             | Updates coingecko configs ([ coingecko-symbol-to-details.json ](/src/fetchers/coingecko/coingecko-symbol-to-details.json) and [ coingecko-symbol-to-id.json ](/src/fetchers/coingecko/coingecko-symbol-to-id.json) using coingecko api |
| tools/coingecko/add-new-tokens-to-coingecko-manifest.ts | Adds **new** tokens (which were not provided by RedStone before) to the [ coingecko manifest ](/manifests/single-source/coingecko.json)                                                                                                |
