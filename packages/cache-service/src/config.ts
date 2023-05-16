import { env } from "./common-config";

const DEFAULT_BUNDLR_NODE_URL = "https://node2.bundlr.network";
const DEFAULT_APP_PORT = 3000;

const envSchema = env
  .object({
    APP_PORT: env.coerce
      .number()
      .int()
      .nonnegative()
      .optional()
      .default(DEFAULT_APP_PORT),

    MONGO_DB_URL: env.string().nonempty(),

    ENABLE_STREAMR_LISTENING: env.boolEnv(),

    ENABLE_DIRECT_POSTING_ROUTES: env.boolEnv(),

    API_KEY_FOR_ACCESS_TO_ADMIN_ROUTES: env.string().nonempty(),

    JWK_KEY_FOR_ARCHIVING_ON_ARWEAVE: env.json(
      env
        .object({
          kty: env.string().nonempty(),
          e: env.string().nonempty(),
          n: env.string().nonempty(),
        })
        .passthrough()
        .optional()
    ),

    BUNDLR_NODE_URL: env
      .string()
      .nonempty()
      .optional()
      .default(DEFAULT_BUNDLR_NODE_URL),

    ALLOWED_STREAMR_DATA_SERVICE_IDS: env.jsonWithDefault(
      [],
      env.array(env.string())
    ),

    USE_MOCK_ORACLE_STATE: env.boolEnv(),
  })
  .transform((value) => {
    return {
      ...value,
      enableArchivingOnArweave: !!value.JWK_KEY_FOR_ARCHIVING_ON_ARWEAVE,
    };
  });

export default env.parseEnv(envSchema);
