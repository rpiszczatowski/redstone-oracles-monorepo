import dotenv from "dotenv";

dotenv.config();

const getFromEnv = (name: string) => {
  const envVariable = process.env[name];
  if (!envVariable) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return envVariable;
};

export const config = Object.freeze({
  iterationInterval: getFromEnv("ITERATION_INTERVAL"),
  rpcUrl: getFromEnv("RPC_URL"),
});
