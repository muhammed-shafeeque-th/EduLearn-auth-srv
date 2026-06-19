import dotenv from 'dotenv';
import { EnvNotFoundError } from '../errors/env-not-found.error';

if (process.env.DOCKER_ENV !== 'true') {
  dotenv.config();
}

type Primitive = string | number | boolean;
type EnvDefaultConfig = {
  required?: boolean;
  default?: Primitive;
  parser?: (val: string) => Primitive;
};

type EnvConfigValue = Primitive | EnvDefaultConfig | undefined;
type EnvConfig<T extends Record<string, EnvConfigValue>> = { [K in keyof T]: Primitive };

/**
 * Helper to properly parse environment variables using type inference and custom parsers when needed.
 */
function parseEnvValue(
  key: string,
  value: string | undefined,
  def: EnvDefaultConfig | Primitive | undefined,
): Primitive {
  let parser: ((val: string) => Primitive) | undefined = undefined;
  let required = false;
  let defaultValue: Primitive | undefined = undefined;

  if (def && typeof def === 'object' && !Array.isArray(def)) {
    required = def.required ?? false;
    defaultValue = def.default;
    parser = def.parser;
  } else {
    defaultValue = def as Primitive;
  }

  if (typeof value === 'undefined' || value === '') {
    if (typeof defaultValue !== 'undefined') {
      return defaultValue;
    }
    if (required) {
      throw new EnvNotFoundError(key);
    }
    return undefined as any;
  }

  if (parser) {
    return parser(value);
  }

  if (typeof defaultValue === 'number') {
    const n = Number(value);
    if (Number.isNaN(n)) {
      throw new Error(`Invalid number value for environment variable ${key}`);
    }
    return n;
  }
  if (typeof defaultValue === 'boolean') {
    return value.toLowerCase() === 'true' || value === '1';
  }
  return value;
}

/**
 * Retrieves, validates, and parses environment variables according to configuration.
 *
 * @template T The schema for environment variables.
 * @param envSchema Schema mapping keys to default values, or config objects.
 * @returns An object with properly typed environment values.
 * @throws EnvNotFoundError if a required variable is missing and no default is present.
 */
export function getEnvs<T extends Record<string, EnvConfigValue>>(envSchema: T): EnvConfig<T> {
  const result = {} as EnvConfig<T>;
  for (const key in envSchema) {
    if (Object.prototype.hasOwnProperty.call(envSchema, key)) {
      const def = envSchema[key];
      const rawVal = process.env[key];
      result[key] = parseEnvValue(key, rawVal, def);
    }
  }
  return result;
}
