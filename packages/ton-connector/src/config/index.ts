import dotenv from "dotenv";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";

dotenv.config();

const API_ENDPOINT = getHttpV4Endpoint({
  network: "testnet",
});
// getHttpEndpoint({network: "testnet" })

const getFromEnv = (name: string) => {
  const envVariable = process.env[name];
  if (!envVariable) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return envVariable;
};

export const config = Object.freeze({
  mnemonic: getFromEnv("WALLET_MNEMONIC").split(" "),
  apiKey: getFromEnv("TONCENTER_API_KEY"),
  apiEndpoint: API_ENDPOINT,
});
