# Agent Bridge Instructions

## Cross-Workspace Communication

This workspace is connected to Agent Bridge — a real-time communication layer between Claude Code instances across machines and workspaces.

### MANDATORY behaviors (follow these every conversation):

1. **On conversation start**: Call `register` with your workspace ID and a description of what you're working on. Then call `receive` to check for messages from other agents.

2. **Before starting any task**: Call `receive` to check if another workspace has sent context, decisions, or requests that affect your work.

3. **After completing significant work**: Call `send` to notify other workspaces about what you built, changed, or decided. Include relevant details (API endpoints, schemas, interfaces, file paths).

4. **When you change a shared interface**: Call `share_artifact` to publish the updated schema/interface/config so other workspaces can consume it immediately.

5. **When switching tasks**: Call `update_status` so other agents know what you're currently working on.

6. **When the user mentions another workspace**: Call `status` to see what all workspaces are doing, then `receive` to check for related messages.

### Workspace identity

<!-- EDIT THESE for each workspace -->
- **workspace_id**: `CHANGE-ME` (e.g., "desktop-api", "laptop-frontend")
- **machine**: `CHANGE-ME` (e.g., "desktop", "laptop")

### Example flow

```
1. register("desktop-api", "Building user auth REST API", "desktop")
2. receive("desktop-api")  → see any pending messages
3. ... do work ...
4. send(from: "desktop-api", to: "*", type: "info", content: "POST /api/users endpoint is live, accepts {email, password, name}")
5. share_artifact(from: "desktop-api", name: "user-api-schema", type: "schema", content: "...")
6. update_status("desktop-api", "Moving to JWT token generation")
```
