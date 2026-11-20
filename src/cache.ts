import { Redis } from "ioredis";
import { config } from "./config.js";

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  lazyConnect: config.env === "test",
});

redis.on("error", (err: Error) => {
  if (config.env !== "test") console.warn("[redis]", err.message);
});

/** Read-through cache that falls back to the loader when Redis is unavailable. */
export async function cached<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch {
    return loader();
  }
  const value = await loader();
  redis.set(key, JSON.stringify(value), "EX", ttlSeconds).catch(() => undefined);
  return value;
}

/** Stable cache key for a filter object, independent of property order. */
export function keyFor(prefix: string, params: Record<string, unknown>): string {
  const parts = Object.keys(params)
    .filter((k) => params[k] !== undefined && params[k] !== "")
    .sort()
    .map((k) => `${k}=${String(params[k]).toLowerCase()}`);
  return `${prefix}:${parts.join("&")}`;
}
