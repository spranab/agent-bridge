# Agent Bridge

MCP server for real-time cross-machine communication between Claude Code instances across workspaces.

## How it works

```
Desktop (Workspace A)  ←→  Redis  ←→  Laptop (Workspace B)
    Claude Code              ↕           Claude Code
                        Agent Bridge
                        MCP Server
```

Each Claude Code instance connects to the same Agent Bridge MCP server backed by a shared Redis instance. Agents can send messages, share artifacts, and see each other's status in real-time.

## Prerequisites

- Node.js 18+
- Redis server accessible from all machines (local, cloud, or Docker)

## Setup

```bash
npm install
```

## Running

### Option 1: SSE mode (recommended for cross-machine)

Run the server on one machine (or a shared server):

```bash
# Default port 4100
npm run start:sse

# Custom port
AGENT_BRIDGE_PORT=8080 npm run start:sse

# Custom Redis URL
AGENT_BRIDGE_REDIS_URL=redis://your-redis-host:6379 npm run start:sse
```

Then configure Claude Code on **each machine** — add to your `claude_desktop_config.json` or `.claude/settings.json`:

```json
{
  "mcpServers": {
    "agent-bridge": {
      "type": "sse",
      "url": "http://YOUR_SERVER_IP:4100/sse"
    }
  }
}
```

### Option 2: Stdio mode (single machine, multiple workspaces)

Each workspace spawns its own process but they share Redis:

```json
{
  "mcpServers": {
    "agent-bridge": {
      "command": "node",
      "args": ["/path/to/agent-bridge/src/server.js"],
      "env": {
        "AGENT_BRIDGE_REDIS_URL": "redis://localhost:6379"
      }
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `register` | Register this workspace with the bridge |
| `send` | Send a message to a specific workspace or broadcast |
| `receive` | Check for pending messages |
| `status` | See all registered workspaces |
| `update_status` | Update what you're working on |
| `share_artifact` | Share code, schemas, configs across workspaces |
| `get_artifact` | Retrieve a shared artifact |
| `list_artifacts` | List all shared artifacts |

## Usage Example

**Workspace A** (desktop, building API):
```
→ register("desktop-api", "Building REST API for user auth", "desktop")
→ share_artifact(from: "desktop-api", name: "user-schema", type: "schema", content: "{ id, email, name }")
→ send(from: "desktop-api", to: "laptop-frontend", type: "info", content: "User API is ready at /api/users")
```

**Workspace B** (laptop, building frontend):
```
→ register("laptop-frontend", "Building React frontend", "laptop")
→ receive("laptop-frontend")  // sees the message from desktop-api
→ get_artifact("user-schema")  // gets the shared schema
→ send(from: "laptop-frontend", to: "desktop-api", type: "question", content: "Does /api/users support pagination?")
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENT_BRIDGE_REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `AGENT_BRIDGE_PORT` | `4100` | SSE server port |
| `AGENT_BRIDGE_PREFIX` | `agent-bridge:` | Redis key prefix |

## Quick Redis Setup

```bash
# Docker (easiest)
docker run -d --name redis -p 6379:6379 redis:alpine

# Or use a cloud Redis (Upstash, Redis Cloud, etc.)
# Just set AGENT_BRIDGE_REDIS_URL to the connection string
```
