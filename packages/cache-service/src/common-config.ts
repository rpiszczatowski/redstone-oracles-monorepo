import "dotenv/config";
import { ZodEffects, z as zod } from "zod";
import { CamelCasedProperties } from "type-fest";

const doConvertToCamelCase = (str: string) => {
  const matched = str.match(
    /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
  ) as RegExpMatchArray;

  const pascalCase = matched
    .map((x: string) => x.slice(0, 1).toUpperCase() + x.slice(1).toLowerCase())
    .join("");

  return pascalCase.slice(0, 1).toLowerCase() + pascalCase.slice(1);
};

const convertObjToCamelCase = <T>(val: T): CamelCasedProperties<T> => {
  const camelCased: Record<string, any> = {};
  for (const [key, value] of Object.entries(val as any)) {
    camelCased[doConvertToCamelCase(key)] = value;
  }

  return camelCased as CamelCasedProperties<T>;
};

const convertToCamelCase = <T extends zod.ZodTypeAny>(
  zod: T
): ZodEffects<zod.infer<T>, CamelCasedProperties<T["_output"]>> =>
  zod.transform(convertObjToCamelCase);

const json = <T extends zod.ZodTypeAny>(zodSchema: T) =>
  zod.preprocess(coerceJson, zodSchema);

const jsonWithDefault = <T extends zod.ZodTypeAny>(
  defaultValue: any,
  zodSchema: T
) => zod.preprocess(coerceJsonWithDefault(defaultValue), zodSchema);

const coerceJson = (val: string | undefined, defaultValue?: any) =>
  val ? JSON.parse(val) : defaultValue;

const coerceJsonWithDefault =
  (defaultValue: any) => (val: string | undefined) =>
    coerceJson(val, defaultValue);

const boolEnv = () => zod.preprocess((val) => val === "true", zod.boolean());

const parseEnv = <T extends zod.ZodTypeAny>(schema: T) => {
  const camelCasedSchema = convertToCamelCase(schema);

  return Object.freeze(camelCasedSchema.parse(process.env)) as Readonly<
    zod.output<typeof camelCasedSchema>
  >;
};

export const env = {
  ...zod,
  parseEnv,
  boolEnv,
  json,
  jsonWithDefault,
};
