#!/usr/bin/env node

/**
 * Persistent Redis listener for Agent Bridge.
 *
 * Runs as a long-lived background task. On each incoming message,
 * writes it to a queue file (.agent-bridge-inbox) in the current directory.
 * The UserPromptSubmit hook reads this file on each turn.
 *
 * Never exits (unless Redis disconnects or 10-min idle timeout).
 */

import Redis from "ioredis";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const REDIS_URL = process.env.AGENT_BRIDGE_REDIS_URL || "redis://localhost:6379";
const WS_CHANNEL_PREFIX = "agent-bridge:ws:";
let WORKSPACE_ID = process.env.AGENT_BRIDGE_WORKSPACE_ID;

// Read from .mcp.json if not set
if (!WORKSPACE_ID) {
  try {
    const mcpPath = resolve(process.cwd(), ".mcp.json");
    const mcpConfig = JSON.parse(readFileSync(mcpPath, "utf-8"));
    const bridge = mcpConfig?.mcpServers?.["agent-bridge"];
    if (bridge?.env) WORKSPACE_ID = bridge.env.AGENT_BRIDGE_WORKSPACE_ID;
  } catch {}
}

if (!WORKSPACE_ID) {
  console.error("No workspace_id found");
  process.exit(1);
}

const QUEUE_FILE = resolve(process.cwd(), ".agent-bridge-inbox");

const sub = new Redis(REDIS_URL);

await sub.subscribe(
  `${WS_CHANNEL_PREFIX}${WORKSPACE_ID}`,
  `${WS_CHANNEL_PREFIX}broadcast`
);

console.log(`Listening on ${WS_CHANNEL_PREFIX}${WORKSPACE_ID}`);

sub.on("message", async (ch, raw) => {
  try {
    const msg = JSON.parse(raw);
    if (msg.from === WORKSPACE_ID) return;

    // Append to queue file
    let queue = [];
    if (existsSync(QUEUE_FILE)) {
      try {
        queue = JSON.parse(readFileSync(QUEUE_FILE, "utf-8"));
      } catch {}
    }
    queue.push(msg);
    writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));

    const prio = msg.priority === "high" || msg.priority === "urgent" ? ` [${msg.priority.toUpperCase()}]` : "";
    console.log(`[${new Date().toISOString()}] ${msg.from}${prio}: ${msg.content.slice(0, 100)}`);
  } catch {}
});

// Keep alive — no timeout, runs until killed
process.on("SIGINT", async () => {
  await sub.quit();
  process.exit(0);
});
