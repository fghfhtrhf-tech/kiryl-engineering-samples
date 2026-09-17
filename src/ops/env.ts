import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  DATABASE_URL: z.string().min(10),
  REDIS_URL: z.string().min(8).optional(),
  PARTNER_API_URL: z.string().url().optional(),
  HMAC_SECRET: z.string().min(16),
  PUBLIC_ORIGIN: z.string().url()
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(raw: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(raw);
}
