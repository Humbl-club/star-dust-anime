import { Ratelimit } from "https://deno.land/x/upstash_ratelimit@v0.4.4/mod.ts";
import { Redis } from "https://deno.land/x/upstash_redis@v1.22.1/mod.ts";

const redis = new Redis({
  url: Deno.env.get('UPSTASH_REDIS_URL')!,
  token: Deno.env.get('UPSTASH_REDIS_TOKEN')!,
});

export const rateLimiter = {
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 h"),
    analytics: true,
  }),
  
  search: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    analytics: true,
  }),
  
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    analytics: true,
  }),
};

export async function checkRateLimit(
  identifier: string,
  limiter: keyof typeof rateLimiter
) {
  const { success, limit, reset, remaining } = await rateLimiter[limiter].limit(identifier);
  
  return {
    success,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(reset).toISOString(),
    },
  };
}