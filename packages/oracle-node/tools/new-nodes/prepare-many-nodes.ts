import prompts from "prompts";
import fs from "fs";
import Arweave from "arweave/node";
import { ethers } from "ethers";
import { RegisterNodeInputData } from "@redstone-finance/oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/types";
import path from "path";

const DEFAULT_LOGO_URL =
  "https://redstone.finance/assets/img/redstone-logo-full.svg";
const DEFAULT_NODE_URL = "https://redstone.finance";
const DEFAULT_IP_ADDRESS = "0.0.0.0";
const DEFAULT_NAME_PREFIX = "redstone-primary-prod-node-";
const DEFAULT_DESCRIPTION_PREFIX =
  "Data feeds from primary redstone nodes - prod node ";
const DEFAULT_DATA_SERVICE_ID = "redstone-primary-prod";
const ORACLE_REGISTRY_STATE_FILE = path.resolve(
  __dirname,
  "../../../oracles-smartweave-contracts/src/contracts/redstone-oracle-registry/initial-state.json"
);
const JWK_ENV_PREFIX = "ARWEAVE_KEY_";
const ECDSA_ENV_PREFIX = "ECDSA_KEY_";
const SECRETS_ENV_FILE_PATH = ".env-secrets";

interface InitialParamsForNewNodes {
  namePrefixForNodes: string;
  descriptionPrefixForNodes: string;
  dataFeedId: string;
  startNodeIndex: number;
  newNodesCount: number;
}

const arweave = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

main();

async function main() {
  const initialParams = await getInitialParams();
  const { startNodeIndex, newNodesCount } = initialParams;

  for (
    let nodeIndex = startNodeIndex;
    nodeIndex < newNodesCount + startNodeIndex;
    nodeIndex++
  ) {
    console.log(`\n\nRegistering node: ${nodeIndex}`);
    await registerNewNode(nodeIndex, initialParams);
  }
}

async function registerNewNode(
  nodeIndex: number,
  nodesParams: InitialParamsForNewNodes
) {
  // Node details
  const name = nodesParams.namePrefixForNodes + nodeIndex;
  const description = nodesParams.descriptionPrefixForNodes + nodeIndex;

  // Generate arweave wallet
  console.log(`Generating Arweave and EVM wallets`);
  const jwk = await arweave.wallets.generate();
  const arweaveAddress = await arweave.wallets.jwkToAddress(jwk);
  const arweavePublicKey = jwk.n;

  // Generate evm wallet
  const evmWallet = ethers.Wallet.createRandom();
  const evmPrivateKey = evmWallet.privateKey;
  const evmPublicKey = evmWallet.publicKey;
  const evmAddress = evmWallet.address;

  // Register node in oracle registry
  registerNewNodeInOracleRegistry(
    {
      name,
      description,
      logo: DEFAULT_LOGO_URL,
      dataServiceId: nodesParams.dataFeedId,
      evmAddress,
      url: DEFAULT_NODE_URL,
      ipAddress: DEFAULT_IP_ADDRESS,
      ecdsaPublicKey: evmPublicKey,
      arweavePublicKey: arweavePublicKey,
    },
    arweaveAddress
  );

  // Save private keys in .env-secrets
  updateEnvFile(JWK_ENV_PREFIX + nodeIndex, JSON.stringify(jwk));
  updateEnvFile(ECDSA_ENV_PREFIX + nodeIndex, evmPrivateKey);
}

function registerNewNodeInOracleRegistry(
  nodeOpts: RegisterNodeInputData,
  arweaveAddress: string
) {
  const currentState = readJSONFromFile(ORACLE_REGISTRY_STATE_FILE);
  const newState = { ...currentState };
  newState.nodes[arweaveAddress] = nodeOpts;
  saveJSONInFile(ORACLE_REGISTRY_STATE_FILE, newState, {
    prettifyJSON: true,
  });
}

function readJSONFromFile(path: string): any {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function saveJSONInFile(path: string, data: any, opts?: any) {
  const actionOnFile = fs.existsSync(path) ? "Updating" : "Creating";
  console.log(`${actionOnFile} file: ${path}`);
  const strData =
    JSON.stringify(data, undefined, opts?.prettifyJSON ? 2 : undefined) + "\n";
  fs.writeFileSync(path, strData);
}

async function getInitialParams(): Promise<InitialParamsForNewNodes> {
  return await prompts([
    {
      type: "text",
      name: "namePrefixForNodes",
      message: "Provide name prefix of redstone nodes",
      initial: DEFAULT_NAME_PREFIX,
      validate: (value) => (!value ? "Required" : true),
    },
    {
      type: "text",
      name: "descriptionPrefixForNodes",
      message: "Provide description prefix of redstone nodes",
      initial: DEFAULT_DESCRIPTION_PREFIX,
      validate: (value) => (!value ? "Required" : true),
    },
    {
      type: "text",
      name: "dataFeedId",
      message: "Provide data service id for the new nodes",
      initial: DEFAULT_DATA_SERVICE_ID,
      validate: (value) => (!value ? "Required" : true),
    },
    {
      type: "number",
      name: "startNodeIndex",
      message: "Provide start node index (should be greater than 0)",
      initial: 1,
      validate: (value) => (Number(value) < 1 ? "Must be >= 1" : true),
    },
    {
      type: "number",
      name: "newNodesCount",
      message: "Provide number of new nodes (should be greater than 0)",
      initial: 1,
      validate: (value) => (Number(value) < 1 ? "Must be >= 1" : true),
    },
  ]);
}

function updateEnvFile(envVarName: string, value: string) {
  console.log(`Updating file: ${SECRETS_ENV_FILE_PATH}`);
  fs.appendFileSync(SECRETS_ENV_FILE_PATH, `${envVarName}='${value}'\n`);
}
