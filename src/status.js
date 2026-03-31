#!/usr/bin/env node

/**
 * SwarmCode status — show all workspaces and pending messages.
 *
 * Usage: swarmcode status [--redis <redis-url>]
 */

import Redis from "ioredis";
import { readFileSync } from "fs";
import { resolve } from "path";

let REDIS_URL = process.env.SWARMCODE_REDIS_URL || process.env.AGENT_BRIDGE_REDIS_URL;

// Read from .mcp.json if not set
if (!REDIS_URL) {
  try {
    const mcpPath = resolve(process.cwd(), ".mcp.json");
    const mcpConfig = JSON.parse(readFileSync(mcpPath, "utf-8"));
    const sc = mcpConfig?.mcpServers?.["swarmcode"];
    if (sc?.env) REDIS_URL = sc.env.SWARMCODE_REDIS_URL;
  } catch {}
}

// Check --redis flag
const redisIdx = process.argv.indexOf("--redis");
if (redisIdx !== -1) REDIS_URL = process.argv[redisIdx + 1];

if (!REDIS_URL) {
  REDIS_URL = "redis://localhost:6379";
}

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[38;5;114m",
  red: "\x1b[38;5;210m",
  yellow: "\x1b[38;5;221m",
  blue: "\x1b[38;5;75m",
  gray: "\x1b[38;5;244m",
  purple: "\x1b[38;5;141m",
};

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

try {
  const redis = new Redis(REDIS_URL, { keyPrefix: "swarmcode:" });

  const raw = await redis.hgetall("workspaces");
  const workspaces = Object.values(raw).map((v) => JSON.parse(v));

  for (const ws of workspaces) {
    ws.pending_messages = await redis.llen(`inbox:${ws.id}`);
  }

  workspaces.sort((a, b) => new Date(b.last_active) - new Date(a.last_active));

  console.log();
  console.log(`${c.bold}${c.purple}  SwarmCode Status${c.reset}  ${c.dim}(${REDIS_URL})${c.reset}`);
  console.log(`${c.gray}  ${"─".repeat(50)}${c.reset}`);

  if (workspaces.length === 0) {
    console.log(`  ${c.dim}No workspaces registered.${c.reset}`);
  } else {
    for (const ws of workspaces) {
      const active = (Date.now() - new Date(ws.last_active)) < 600000;
      const status = active ? `${c.green}active${c.reset}` : `${c.red}idle${c.reset}`;
      const pending = ws.pending_messages > 0 ? `  ${c.yellow}${ws.pending_messages} pending${c.reset}` : "";

      console.log(`  ${c.bold}${c.blue}${ws.id}${c.reset}  ${status}${pending}`);
      if (ws.description) console.log(`    ${c.dim}${ws.description}${c.reset}`);
      console.log(`    ${c.gray}${ws.machine || "unknown"} · ${timeAgo(ws.last_active)}${c.reset}`);
    }
  }

  // Message log count
  const logLen = await redis.llen("messages:log");
  console.log(`${c.gray}  ${"─".repeat(50)}${c.reset}`);
  console.log(`  ${c.dim}${workspaces.length} workspace(s) · ${logLen} messages in log${c.reset}`);
  console.log();

  await redis.quit();
} catch (err) {
  console.error(`Could not connect to Redis at ${REDIS_URL}: ${err.message}`);
  process.exit(1);
}
