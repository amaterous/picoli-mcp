---
name: picoli-mcp
description: >
  URL shortener and click analytics via picoli.site MCP server.
  Use when the user wants to shorten URLs, create custom short links,
  track link clicks, or analyze link performance.
  Keywords: URL shortening, short link, analytics, click tracking.
license: MIT
metadata:
  author: amaterous
  version: "1.0.1"
---

# picoli-mcp

URL shortening and click analytics for AI agents via [picoli.site](https://picoli.site).

## Prerequisites

- picoli.site account and API key (get one at https://picoli.site)
- MCP server configured with `PICOLI_API_KEY` environment variable

## Available Tools

### `shorten_url`
Create a single short URL. Optionally specify a custom slug.

### `shorten_urls`
Batch-shorten up to 500 URLs at once. Each URL can have an optional custom slug.

### `get_link_stats`
Get click statistics for links by slug. Returns human clicks (bot traffic excluded).

### `list_links`
List all shortened URLs with click counts. Supports pagination (default 20 per page, max 100).

### `get_analytics`
Get analytics overview: top 10 links by clicks, daily click trends, and total link count. Defaults to last 7 days.

## Usage Guidelines

- When shortening a single URL, use `shorten_url`. For multiple URLs, use `shorten_urls`.
- Custom slugs are optional. If omitted, a random slug is generated.
- When reporting stats, always show the full short URL (e.g. `https://picoli.site/slug`), not just the slug.
- `get_link_stats` excludes bot traffic automatically.
- For date-ranged analytics, use `get_analytics` with `start_date` and `end_date` in YYYY-MM-DD format.
