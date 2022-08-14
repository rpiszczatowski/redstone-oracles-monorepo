import "dotenv/config";

const getEnv = (envName: string): string => {
  if (!process.env[envName]) {
    throw new Error(`Env variable not found: ${envName}`);
  }
  return process.env[envName] as string;
};

export default {
  mongoDbUrl: getEnv("MONGO_DB_URL"),
};
