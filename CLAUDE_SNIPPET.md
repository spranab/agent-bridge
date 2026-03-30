# Agent Bridge — Workspace Setup Guide

To connect any workspace to Agent Bridge, create these 3 files in your project root. Replace `YOUR_WORKSPACE_ID` and `YOUR_MACHINE` everywhere.

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

## 2. `.claude/settings.json` — auto-checks inbox on every turn

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

## 3. `CLAUDE.md` — add this block to your project's CLAUDE.md

```markdown
## Agent Bridge

This workspace is connected to Agent Bridge for cross-workspace communication.

### MANDATORY behaviors:

1. **On conversation start**: Call `register` with workspace_id "YOUR_WORKSPACE_ID", a description of current work, and machine "YOUR_MACHINE". Then call `receive` to check for messages.
2. **Before starting any task**: Call `receive` to check for pending messages.
3. **After completing significant work**: Call `send` to notify other workspaces.
4. **When changing shared interfaces**: Call `share_artifact` to publish updates.
5. **When switching tasks**: Call `update_status`.
6. **When user mentions another workspace**: Call `status` then `receive`.

### Workspace identity

- **workspace_id**: `YOUR_WORKSPACE_ID`
- **machine**: `YOUR_MACHINE`
```

---

## Example workspace IDs

Pick short, descriptive names:
- `desktop-api` — desktop machine, working on API
- `laptop-frontend` — laptop, working on frontend
- `server-etl` — server, running ETL pipeline
- `desktop-docs` — desktop, writing documentation
