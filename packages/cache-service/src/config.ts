import "dotenv/config";

const getEnv = (envName: string): string => {
  if (!process.env[envName]) {
    throw new Error(`Env variable not found: ${envName}`);
  }
  return process.env[envName] as string;
};

export default {
  mongoDbUrl: getEnv("MONGO_DB_URL"),
  enableStreamrListening: getEnv("ENABLE_STREAMR_LISTENING") === "true",
  enableDirectPostingRoutes: getEnv("ENABLE_DIRECT_POSTING_ROUTES") === "true",
  streamrUnsubscribeDelayMilliseconds: 120 * 1000,
};
