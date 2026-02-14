import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Config } from "./config.js";

async function picoliRequest(
  config: Config,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${config.baseUrl}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      ...options.headers,
    },
  });
}

export function registerTools(server: McpServer, config: Config): void {
  // ── shorten_url ──────────────────────────────────────
  server.registerTool(
    "shorten_url",
    {
      title: "Shorten URL",
      description:
        "Create a short URL using picoli.site. Optionally specify a custom slug. Returns the shortened URL and slug.",
      inputSchema: z.object({
        url: z.string().url().describe("The destination URL to shorten"),
        slug: z
          .string()
          .optional()
          .describe(
            "Optional custom slug (e.g. 'my-link'). If not provided, a random slug is generated."
          ),
      }),
    },
    async ({ url, slug }) => {
      const link: { url: string; slug?: string } = { url };
      if (slug) link.slug = slug;

      const res = await picoliRequest(config, "/api/links/bulk", {
        method: "POST",
        body: JSON.stringify({ links: [link] }),
      });

      if (!res.ok) {
        const error = await res.text();
        return {
          content: [{ type: "text", text: `Error: ${res.status} - ${error}` }],
          isError: true,
        };
      }

      const data = await res.json();

      if (data.errors?.length > 0) {
        return {
          content: [
            { type: "text", text: `Error: ${data.errors[0].error}` },
          ],
          isError: true,
        };
      }

      const created = data.links[0];
      const shortUrl = `${config.baseUrl}/${created.slug}`;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                shortUrl,
                slug: created.slug,
                destinationUrl: created.destination_url,
                createdAt: created.created_at,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ── shorten_urls ─────────────────────────────────────
  server.registerTool(
    "shorten_urls",
    {
      title: "Shorten Multiple URLs",
      description:
        "Create multiple short URLs at once (up to 500). Each URL can have an optional custom slug.",
      inputSchema: z.object({
        links: z
          .array(
            z.object({
              url: z.string().url().describe("The destination URL"),
              slug: z.string().optional().describe("Optional custom slug"),
            })
          )
          .min(1)
          .max(500)
          .describe("Array of URLs to shorten"),
      }),
    },
    async ({ links }) => {
      const res = await picoliRequest(config, "/api/links/bulk", {
        method: "POST",
        body: JSON.stringify({ links }),
      });

      if (!res.ok) {
        const error = await res.text();
        return {
          content: [{ type: "text", text: `Error: ${res.status} - ${error}` }],
          isError: true,
        };
      }

      const data = await res.json();
      const results = (data.links || []).map(
        (l: { slug: string; destination_url: string }) => ({
          shortUrl: `${config.baseUrl}/${l.slug}`,
          slug: l.slug,
          destinationUrl: l.destination_url,
        })
      );

      const summary = {
        created: data.created,
        errors: data.errors?.length || 0,
        links: results,
      };

      if (data.errors?.length > 0) {
        (summary as Record<string, unknown>).errorDetails = data.errors;
      }

      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      };
    }
  );

  // ── get_link_stats ───────────────────────────────────
  server.registerTool(
    "get_link_stats",
    {
      title: "Get Link Stats",
      description:
        "Get click statistics for one or more short links by their slugs. Returns human click counts (bot traffic excluded).",
      inputSchema: z.object({
        slugs: z
          .array(z.string())
          .min(1)
          .max(500)
          .describe(
            "Array of slugs to get stats for (e.g. ['my-link', 'abc123'])"
          ),
      }),
    },
    async ({ slugs }) => {
      const res = await picoliRequest(config, "/api/stats/batch", {
        method: "POST",
        body: JSON.stringify({ slugs }),
      });

      if (!res.ok) {
        const error = await res.text();
        return {
          content: [{ type: "text", text: `Error: ${res.status} - ${error}` }],
          isError: true,
        };
      }

      const data = await res.json();
      const stats = (data.stats || []).map(
        (s: {
          slug: string;
          destination_url: string;
          human_clicks: number;
          created_at: string;
        }) => ({
          slug: s.slug,
          shortUrl: `${config.baseUrl}/${s.slug}`,
          destinationUrl: s.destination_url,
          clicks: s.human_clicks,
          createdAt: s.created_at,
        })
      );

      // Identify slugs with no data
      const foundSlugs = new Set(stats.map((s: { slug: string }) => s.slug));
      const notFound = slugs.filter((s) => !foundSlugs.has(s));

      const result: Record<string, unknown> = { stats };
      if (notFound.length > 0) {
        result.notFound = notFound;
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ── list_links ───────────────────────────────────────
  server.registerTool(
    "list_links",
    {
      title: "List Links",
      description:
        "List all shortened URLs with their click counts. Supports pagination.",
      inputSchema: z.object({
        page: z
          .number()
          .int()
          .positive()
          .default(1)
          .describe("Page number (default: 1)"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(20)
          .describe("Items per page (default: 20, max: 100)"),
      }),
    },
    async ({ page, limit }) => {
      const res = await picoliRequest(
        config,
        `/api/links?page=${page}&limit=${limit}`
      );

      if (!res.ok) {
        const error = await res.text();
        return {
          content: [{ type: "text", text: `Error: ${res.status} - ${error}` }],
          isError: true,
        };
      }

      const data = await res.json();
      const links = (data.data || []).map(
        (l: {
          slug: string;
          destination_url: string;
          clicks: number;
          created_at: string;
        }) => ({
          shortUrl: `${config.baseUrl}/${l.slug}`,
          slug: l.slug,
          destinationUrl: l.destination_url,
          clicks: l.clicks,
          createdAt: l.created_at,
        })
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { links, pagination: data.pagination },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ── get_analytics ────────────────────────────────────
  server.registerTool(
    "get_analytics",
    {
      title: "Get Analytics",
      description:
        "Get analytics overview: top 10 links by clicks, daily click stats, and total link count. Defaults to last 7 days.",
      inputSchema: z.object({
        start_date: z
          .string()
          .optional()
          .describe("Start date in YYYY-MM-DD format (default: 7 days ago)"),
        end_date: z
          .string()
          .optional()
          .describe("End date in YYYY-MM-DD format (default: today)"),
      }),
    },
    async ({ start_date, end_date }) => {
      const params = new URLSearchParams();
      if (start_date) params.set("start_date", start_date);
      if (end_date) params.set("end_date", end_date);

      const query = params.toString();
      const path = `/api/stats${query ? `?${query}` : ""}`;

      const res = await picoliRequest(config, path);

      if (!res.ok) {
        const error = await res.text();
        return {
          content: [{ type: "text", text: `Error: ${res.status} - ${error}` }],
          isError: true,
        };
      }

      const data = await res.json();

      const result = {
        dateRange: data.date_filter,
        totalLinks: data.total_links,
        top10: (data.top_10 || []).map(
          (t: { slug: string; human_clicks: number }) => ({
            shortUrl: `${config.baseUrl}/${t.slug}`,
            slug: t.slug,
            clicks: t.human_clicks,
          })
        ),
        dailyStats: data.daily_stats || [],
      };

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
