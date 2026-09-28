import Redis from "ioredis";

// Standard Redis client singleton with graceful fallback
const getRedisUrl = () => process.env.REDIS_URL || "redis://localhost:6379";

class ResQRedisClient {
  private client: Redis | null = null;
  private isConnected = false;

  constructor() {
    try {
      this.client = new Redis(getRedisUrl(), {
        maxRetriesPerRequest: 2,
        retryStrategy(times) {
          if (times > 3) return null; // Stop retrying after 3 attempts
          return Math.min(times * 100, 1000);
        },
        lazyConnect: true,
      });

      this.client.on("connect", () => {
        this.isConnected = true;
        console.log("[Redis] Connected to Redis stream cluster");
      });

      this.client.on("error", (err) => {
        this.isConnected = false;
        // Suppress unhandled error noise in dev if Redis isn't running
      });
    } catch {
      this.isConnected = false;
    }
  }

  async connectIfNeeded() {
    if (this.client && !this.isConnected) {
      try {
        await this.client.connect();
        this.isConnected = true;
      } catch {
        this.isConnected = false;
      }
    }
  }

  get instance() {
    return this.client;
  }

  get active() {
    return this.isConnected;
  }
}

export const redisManager = new ResQRedisClient();

/**
 * Pushes raw SOS distress packet to Redis Stream 'sos:stream'
 */
export async function pushSOSToStream(sosData: Record<string, any>): Promise<string | null> {
  await redisManager.connectIfNeeded();
  const client = redisManager.instance;

  if (client && redisManager.active) {
    try {
      // XADD sos:stream * field1 val1 field2 val2
      const fields: string[] = [];
      Object.entries(sosData).forEach(([k, v]) => {
        fields.push(k, typeof v === "object" ? JSON.stringify(v) : String(v));
      });
      const streamId = await client.xadd("sos:stream", "*", ...fields);
      return streamId;
    } catch (err) {
      console.warn("[Redis Stream] Fallback to in-memory ingestion buffer", err);
      return null;
    }
  }
  return null;
}

/**
 * Reads pending SOS items from Redis Stream
 */
export async function readSOSStream(count = 10): Promise<Array<{ id: string; data: Record<string, string> }>> {
  await redisManager.connectIfNeeded();
  const client = redisManager.instance;

  if (client && redisManager.active) {
    try {
      // XREAD COUNT count STREAMS sos:stream 0-0
      const results = await client.xread("COUNT", count, "STREAMS", "sos:stream", "0");
      if (!results || !results[0]) return [];

      const streamEntries = results[0][1];
      return streamEntries.map(([id, fields]) => {
        const data: Record<string, string> = {};
        for (let i = 0; i < fields.length; i += 2) {
          data[fields[i]] = fields[i + 1];
        }
        return { id, data };
      });
    } catch (err) {
      return [];
    }
  }
  return [];
}

/**
 * Semantic Vector Cache helper (Redis SETEX / GET)
 */
export async function getSemanticCache(key: string): Promise<string | null> {
  await redisManager.connectIfNeeded();
  const client = redisManager.instance;
  if (client && redisManager.active) {
    try {
      return await client.get(`cache:faq:${key}`);
    } catch {
      return null;
    }
  }
  return null;
}

export async function setSemanticCache(key: string, value: string, ttlSeconds = 300): Promise<void> {
  await redisManager.connectIfNeeded();
  const client = redisManager.instance;
  if (client && redisManager.active) {
    try {
      await client.setex(`cache:faq:${key}`, ttlSeconds, value);
    } catch {}
  }
}
