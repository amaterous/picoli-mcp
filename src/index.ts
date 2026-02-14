#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { registerTools } from "./tools.js";

function createServer(config: { apiKey: string; baseUrl: string }): McpServer {
  const server = new McpServer({
    name: "picoli-mcp",
    version: "1.0.1",
  });
  registerTools(server, config);
  return server;
}

// Smithery sandbox scanning support
export function createSandboxServer(): McpServer {
  return createServer({
    apiKey: "sandbox",
    baseUrl: "https://picoli.site",
  });
}

async function main(): Promise<void> {
  const config = loadConfig();
  const server = createServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("picoli-mcp server running on stdio");
}

// Only run when executed directly (not when imported for scanning)
const isDirectRun =
  process.argv[1] &&
  (process.argv[1].endsWith("picoli-mcp") ||
    process.argv[1].endsWith("index.js") ||
    process.argv[1].endsWith("index.ts"));

if (isDirectRun) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
