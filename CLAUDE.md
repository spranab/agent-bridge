# Agent Bridge

MCP server for real-time cross-machine communication between Claude Code instances.

## Architecture
- `src/server.js` - Entry point, supports stdio and SSE (`--sse`) transport
- `src/redis.js` - Redis connection management with key prefixing
- `src/tools.js` - All MCP tool definitions and handlers

## Key Design Decisions
- Redis for cross-machine communication (not file-based)
- Dual transport: stdio for single-machine, SSE for cross-machine
- Messages stored in per-workspace inbox lists with 24h TTL
- Workspace registrations expire after 2h of inactivity
- Pub/sub channel `agent-bridge:messages` for real-time notifications
- All Redis keys prefixed with `agent-bridge:` (configurable)

## Running
```bash
npm run start        # stdio mode
npm run start:sse    # SSE mode on port 4100
```

## Environment
- `AGENT_BRIDGE_REDIS_URL` - Redis URL (default: redis://localhost:6379)
- `AGENT_BRIDGE_PORT` - SSE port (default: 4100)
- `AGENT_BRIDGE_PREFIX` - Redis key prefix (default: agent-bridge:)
