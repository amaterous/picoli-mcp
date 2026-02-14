import { z } from "zod";

const ConfigSchema = z.object({
  apiKey: z.string().min(1, "PICOLI_API_KEY is required. Get your API key at https://picoli.site"),
  baseUrl: z.string().url().default("https://picoli.site"),
});

export type Config = z.infer<typeof ConfigSchema>;

export function loadConfig(): Config {
  const result = ConfigSchema.safeParse({
    apiKey: process.env.PICOLI_API_KEY,
    baseUrl: process.env.PICOLI_BASE_URL,
  });

  if (!result.success) {
    const errors = result.error.issues.map((i) => `  - ${i.message}`).join("\n");
    console.error(`picoli-mcp: Configuration error:\n${errors}`);
    console.error("\nSet PICOLI_API_KEY in your MCP server configuration.");
    console.error("Get your API key at https://picoli.site");
    process.exit(1);
  }

  return result.data;
}
