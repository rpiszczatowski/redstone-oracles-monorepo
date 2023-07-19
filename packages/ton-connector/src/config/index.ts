import dotenv from "dotenv";

dotenv.config();

const API_ENDPOINT = "https://testnet.toncenter.com/api/v2/jsonRPC";
// getHttpEndpoint({network: "testnet" })

const getFromEnv = (name: string) => {
  const envVariable = process.env[name];
  if (!envVariable) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return envVariable;
};

export const config = Object.freeze({
  mnemonic: getFromEnv("MNEMONIC").split(" "),
  apiKey: getFromEnv("TONCENTER_API_KEY"),
  apiEndpoint: API_ENDPOINT,
});
