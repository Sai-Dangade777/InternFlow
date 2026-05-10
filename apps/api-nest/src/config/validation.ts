import * as Joi from "joi";

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),
  PORT: Joi.number().port().default(4001),
  API_PREFIX: Joi.string().allow("").default(""),
  LOG_LEVEL: Joi.string().default("info"),
  DATABASE_URL: Joi.string().allow("").default(""),
  SUPABASE_URL: Joi.string().uri().allow("").default(""),
  SUPABASE_ANON_KEY: Joi.string().allow("").default(""),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().allow("").default(""),
  SUPABASE_JWT_AUD: Joi.string().default("authenticated"),
  SUPABASE_JWT_ISSUER: Joi.string().allow("").optional(),
  SUPABASE_JWT_JWKS_URL: Joi.string().allow("").optional(),
  REDIS_HOST: Joi.string().default("127.0.0.1"),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow("").optional(),
  REDIS_TLS: Joi.boolean().truthy("true").falsy("false").default(false),
  BULLMQ_PREFIX: Joi.string().default("internflow")
}).unknown(true);
