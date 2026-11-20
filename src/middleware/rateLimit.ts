import type { Request, RequestHandler } from "express";
import { redis } from "../cache.js";

export interface RateLimitOptions {
  prefix: string;
  max: number;
  windowSec: number;
  key?: (req: Request) => string;
}

/**
 * Fixed window rate limiter backed by Redis.
 * Fails open: if Redis is unreachable requests are let through.
 */
export function rateLimit({ prefix, max, windowSec, key = (req) => req.ip ?? "unknown" }: RateLimitOptions): RequestHandler {
  return async (req, res, next) => {
    const id = `ratelimit:${prefix}:${key(req)}`;
    try {
      const results = await redis.multi().incr(id).ttl(id).exec();
      const hits = Number(results?.[0]?.[1] ?? 0);
      const ttl = Number(results?.[1]?.[1] ?? -1);
      if (ttl === -1) await redis.expire(id, windowSec);

      res.setHeader("X-RateLimit-Limit", String(max));
      res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - hits)));

      if (hits > max) {
        res.setHeader("Retry-After", String(ttl > 0 ? ttl : windowSec));
        res.status(429).json({ error: "Too many requests, try again later" });
        return;
      }
    } catch {
      // fail open
    }
    next();
  };
}
