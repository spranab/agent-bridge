# Agent Bridge — Workspace Setup Guide

To connect any workspace to Agent Bridge, create these 2 files in your project root. Replace `YOUR_WORKSPACE_ID` everywhere.

---

## 1. `.mcp.json` — connects Claude Code to the bridge

```json
{
  "mcpServers": {
    "agent-bridge": {
      "type": "sse",
      "url": "https://agent-bridge.mcp.mycluster.cyou/sse"
    }
  }
}
```

## 2. `.claude/settings.json` — auto-checks inbox and sets workspace identity

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "AGENT_BRIDGE_URL=https://agent-bridge.mcp.mycluster.cyou AGENT_BRIDGE_WORKSPACE_ID=YOUR_WORKSPACE_ID node c:\\Users\\sync\\codes\\agent-bridge\\src\\check-inbox-http.js",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

That's it. The hook injects your workspace ID into Claude's context on every turn, and the MCP tool descriptions tell Claude when to register, send, and receive.

---

## Example workspace IDs

Pick short, descriptive names:
- `desktop-api` — desktop machine, working on API
- `laptop-frontend` — laptop, working on frontend
- `server-etl` — server, running ETL pipeline
