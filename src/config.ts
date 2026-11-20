import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().url().default("postgres://jobs:jobs@localhost:5432/jobs"),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  JOBS_CACHE_TTL: z.coerce.number().int().positive().default(60),
  APPLY_RATE_MAX: z.coerce.number().int().positive().default(5),
  APPLY_RATE_WINDOW: z.coerce.number().int().positive().default(3600),
});

const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  redisUrl: env.REDIS_URL,
  jobsCacheTtl: env.JOBS_CACHE_TTL,
  applyRateLimit: { max: env.APPLY_RATE_MAX, windowSec: env.APPLY_RATE_WINDOW },
} as const;

export type Config = typeof config;
