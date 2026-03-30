import Redis from "ioredis";

const REDIS_URL = process.env.AGENT_BRIDGE_REDIS_URL || "redis://localhost:6379";
const KEY_PREFIX = process.env.AGENT_BRIDGE_PREFIX || "agent-bridge:";

let redis = null;
let subscriber = null;

export function getRedis() {
  if (!redis) {
    redis = new Redis(REDIS_URL, { keyPrefix: KEY_PREFIX, lazyConnect: true });
  }
  return redis;
}

export function getSubscriber() {
  if (!subscriber) {
    subscriber = new Redis(REDIS_URL, { lazyConnect: true });
  }
  return subscriber;
}

export function key(name) {
  return `${KEY_PREFIX}${name}`;
}

export async function connect() {
  await getRedis().connect();
  await getSubscriber().connect();
}

export async function disconnect() {
  if (redis) await redis.quit();
  if (subscriber) await subscriber.quit();
}
