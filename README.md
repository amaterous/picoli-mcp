# picoli-mcp

MCP server for [picoli.site](https://picoli.site) — URL shortening and click analytics for AI agents.

Shorten URLs, track clicks, and analyze link performance directly from your AI assistant.

## Setup

### 1. Get your API key

Create an account at [picoli.site](https://picoli.site) and get your API key from the dashboard.

### 2. Configure your MCP client

#### Claude Desktop / Claude Code

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "picoli": {
      "command": "npx",
      "args": ["-y", "picoli-mcp"],
      "env": {
        "PICOLI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

#### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "picoli": {
      "command": "npx",
      "args": ["-y", "picoli-mcp"],
      "env": {
        "PICOLI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Tools

### `shorten_url`

Create a short URL with an optional custom slug.

**Example prompts:**
- "Shorten https://example.com/very-long-article-url"
- "Create a short link for https://my-site.com with slug 'launch'"

### `shorten_urls`

Create multiple short URLs at once (up to 500).

**Example prompts:**
- "Shorten these 3 URLs: ..."

### `get_link_stats`

Get click statistics for specific links (bot traffic excluded).

**Example prompts:**
- "How many clicks did my 'launch' link get?"
- "Show me stats for these slugs: launch, demo, blog-post"

### `list_links`

List all shortened URLs with click counts and pagination.

**Example prompts:**
- "Show me all my short links"
- "List my links sorted by clicks"

### `get_analytics`

Get analytics overview: top 10 links, daily click trends, and totals.

**Example prompts:**
- "Show me my link analytics for this week"
- "What are my top performing links?"
- "Give me click stats from 2026-01-01 to 2026-01-31"

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PICOLI_API_KEY` | Yes | — | Your picoli.site API key |
| `PICOLI_BASE_URL` | No | `https://picoli.site` | API base URL (for self-hosted instances) |

## Development

```bash
git clone https://github.com/yun/picoli-mcp.git
cd picoli-mcp
npm install
npm run build
```

Test locally:

```bash
PICOLI_API_KEY=your-key npx tsx src/index.ts
```

## License

MIT
