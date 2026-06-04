# vikunja-mcp

MCP server for [Vikunja](https://vikunja.io) task management. Lightweight API wrapper — no auth dance, just works.

## Tools

| Tool | Description |
|------|-------------|
| `list_projects` | List all projects |
| `get_project` | Get project by ID |
| `create_project` | Create a new project |
| `update_project` | Update a project |
| `delete_project` | Delete a project |
| `list_tasks` | List/filter/search tasks |
| `get_task` | Get task by ID |
| `create_task` | Create a task |
| `update_task` | Update a task |
| `delete_task` | Delete a task |
| `bulk_create_tasks` | Create multiple tasks at once |
| `list_labels` | List all labels |
| `create_label` | Create a label |
| `add_label_to_task` | Tag a task with a label |
| `remove_label_from_task` | Remove label from task |
| `list_comments` | List task comments |
| `add_comment` | Comment on a task |

## Setup

### Claude Code (`~/.claude.json`)

```json
{
  "mcpServers": {
    "vikunja": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "vikunja-mcp"],
      "env": {
        "VIKUNJA_API_URL": "http://your-instance/api/v1",
        "VIKUNJA_API_TOKEN": "tk_your_token_here"
      }
    }
  }
}
```

### From source

```bash
git clone https://github.com/ugoi/vikunja-mcp.git
cd vikunja-mcp
npm install && npm run build
VIKUNJA_API_URL=http://localhost:3456/api/v1 VIKUNJA_API_TOKEN=tk_xxx node dist/index.js
```

## Get an API token

Vikunja UI: **Settings > API Tokens > Create Token**

Grant permissions for: `tasks`, `projects`, `labels` (each: `read_all`, `create`, `update`, `delete`).

## License

MIT
