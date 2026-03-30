#!/usr/bin/env node

/**
 * Lightweight inbox checker for Claude Code hooks.
 * Reads pending messages from Redis and outputs them to stdout.
 * Claude Code injects stdout into conversation context automatically.
 *
 * Usage: AGENT_BRIDGE_WORKSPACE_ID=my-workspace node check-inbox.js
 */

import Redis from "ioredis";

const REDIS_URL = process.env.AGENT_BRIDGE_REDIS_URL || "redis://localhost:6379";
const PREFIX = process.env.AGENT_BRIDGE_PREFIX || "agent-bridge:";
const WORKSPACE_ID = process.env.AGENT_BRIDGE_WORKSPACE_ID;

if (!WORKSPACE_ID) {
  process.exit(0); // silently skip if not configured
}

const redis = new Redis(REDIS_URL, { keyPrefix: PREFIX, lazyConnect: true });

try {
  await redis.connect();

  // Check inbox
  const raw = await redis.lrange(`inbox:${WORKSPACE_ID}`, 0, -1);
  const messages = raw.map((m) => JSON.parse(m)).reverse();

  if (messages.length === 0) {
    await redis.quit();
    process.exit(0); // nothing to report
  }

  // Also check who's online
  const wsRaw = await redis.hgetall("workspaces");
  const workspaces = Object.values(wsRaw).map((v) => JSON.parse(v));

  // Output for Claude's context
  console.log(`\n📨 AGENT BRIDGE: ${messages.length} pending message(s) from other workspaces:\n`);

  for (const msg of messages) {
    const time = new Date(msg.timestamp).toLocaleTimeString();
    const priority = msg.priority === "high" || msg.priority === "urgent" ? ` [${msg.priority.toUpperCase()}]` : "";
    console.log(`  [${time}] ${msg.from} → ${msg.to}${priority} (${msg.type}):`);
    console.log(`    ${msg.content}`);
    if (msg.metadata && Object.keys(msg.metadata).length > 0) {
      console.log(`    metadata: ${JSON.stringify(msg.metadata)}`);
    }
    console.log();
  }

  if (workspaces.length > 0) {
    console.log(`Active workspaces: ${workspaces.map((w) => `${w.id} (${w.description})`).join(", ")}`);
  }

  console.log(`\nIMPORTANT: You have unread messages above. Acknowledge them and call receive("${WORKSPACE_ID}") to mark as read. If any require a response, use send() to reply.\n`);

  await redis.quit();
} catch {
  // Redis not available — silently skip
  await redis.quit().catch(() => {});
  process.exit(0);
}
