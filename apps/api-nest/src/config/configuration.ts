import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "4001", 10),
  apiPrefix: process.env.API_PREFIX ?? "",
  logLevel: process.env.LOG_LEVEL ?? "info",
  database: {
    url: process.env.DATABASE_URL ?? ""
  },
  supabase: {
    url: process.env.SUPABASE_URL ?? "",
    anonKey: process.env.SUPABASE_ANON_KEY ?? "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    jwtAudience: process.env.SUPABASE_JWT_AUD ?? "authenticated",
    jwtIssuer: process.env.SUPABASE_JWT_ISSUER ?? "",
    jwksUrl: process.env.SUPABASE_JWT_JWKS_URL ?? ""
  },
  redis: {
    host: process.env.REDIS_HOST ?? "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === "true"
  },
  bullmq: {
    prefix: process.env.BULLMQ_PREFIX ?? "internflow",
    defaultJobOptions: {
      removeOnComplete: 500,
      removeOnFail: 2000
    }
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET ?? "",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
    refreshSecret:
      process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? "",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? "12", 10)
  }
}));
