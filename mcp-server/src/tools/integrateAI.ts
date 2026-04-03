import { z } from "zod";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  provider: z
    .enum(["openai", "anthropic", "google"])
    .describe("AI provider to integrate"),
  features: z
    .array(z.enum(["vision", "text", "audio"]))
    .describe("AI features to scaffold (vision, text, audio)"),
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the Expo project root. Defaults to cwd."),
};

function generateClientCode(
  provider: string,
  features: string[],
): string {
  const lines: string[] = [];

  lines.push(`// AI client for ${provider}`);
  lines.push(`// API keys must NOT be bundled in the app. Use a backend proxy.`);
  lines.push(``);
  lines.push(`const API_BASE = process.env.EXPO_PUBLIC_AI_PROXY_URL || "http://localhost:3000";`);
  lines.push(``);
  lines.push(`interface AIResponse {`);
  lines.push(`  text: string;`);
  lines.push(`  usage?: { prompt_tokens: number; completion_tokens: number };`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`interface AIError {`);
  lines.push(`  message: string;`);
  lines.push(`  status: number;`);
  lines.push(`}`);
  lines.push(``);
  lines.push(`async function aiRequest(`);
  lines.push(`  endpoint: string,`);
  lines.push(`  body: Record<string, unknown>,`);
  lines.push(`  authToken: string,`);
  lines.push(`): Promise<AIResponse> {`);
  lines.push(`  const controller = new AbortController();`);
  lines.push(`  const timeout = setTimeout(() => controller.abort(), 30000);`);
  lines.push(``);
  lines.push(`  try {`);
  lines.push(`    const res = await fetch(\`\${API_BASE}\${endpoint}\`, {`);
  lines.push(`      method: "POST",`);
  lines.push(`      headers: {`);
  lines.push(`        "Content-Type": "application/json",`);
  lines.push(`        Authorization: \`Bearer \${authToken}\`,`);
  lines.push(`      },`);
  lines.push(`      body: JSON.stringify({ ...body, provider: "${provider}" }),`);
  lines.push(`      signal: controller.signal,`);
  lines.push(`    });`);
  lines.push(``);
  lines.push(`    if (!res.ok) {`);
  lines.push(`      const error = await res.text();`);
  lines.push(`      throw new Error(\`AI request failed (\${res.status}): \${error}\`);`);
  lines.push(`    }`);
  lines.push(``);
  lines.push(`    return res.json();`);
  lines.push(`  } finally {`);
  lines.push(`    clearTimeout(timeout);`);
  lines.push(`  }`);
  lines.push(`}`);

  if (features.includes("text")) {
    lines.push(``);
    lines.push(`export async function generateText(`);
    lines.push(`  prompt: string,`);
    lines.push(`  authToken: string,`);
    lines.push(`): Promise<AIResponse> {`);
    lines.push(`  return aiRequest("/api/ai/text", { prompt }, authToken);`);
    lines.push(`}`);
  }

  if (features.includes("vision")) {
    lines.push(``);
    lines.push(`export async function analyzeImage(`);
    lines.push(`  imageBase64: string,`);
    lines.push(`  prompt: string,`);
    lines.push(`  authToken: string,`);
    lines.push(`): Promise<AIResponse> {`);
    lines.push(`  return aiRequest(`);
    lines.push(`    "/api/ai/vision",`);
    lines.push(`    { prompt, image: \`data:image/jpeg;base64,\${imageBase64}\` },`);
    lines.push(`    authToken,`);
    lines.push(`  );`);
    lines.push(`}`);
  }

  if (features.includes("audio")) {
    lines.push(``);
    lines.push(`export async function transcribeAudio(`);
    lines.push(`  audioUri: string,`);
    lines.push(`  authToken: string,`);
    lines.push(`): Promise<AIResponse> {`);
    lines.push(`  const formData = new FormData();`);
    lines.push(`  formData.append("file", {`);
    lines.push(`    uri: audioUri,`);
    lines.push(`    type: "audio/m4a",`);
    lines.push(`    name: "recording.m4a",`);
    lines.push(`  } as any);`);
    lines.push(``);
    lines.push(`  const controller = new AbortController();`);
    lines.push(`  const timeout = setTimeout(() => controller.abort(), 60000);`);
    lines.push(``);
    lines.push(`  try {`);
    lines.push(`    const res = await fetch(\`\${API_BASE}/api/ai/transcribe\`, {`);
    lines.push(`      method: "POST",`);
    lines.push(`      headers: { Authorization: \`Bearer \${authToken}\` },`);
    lines.push(`      body: formData,`);
    lines.push(`      signal: controller.signal,`);
    lines.push(`    });`);
    lines.push(``);
    lines.push(`    if (!res.ok) throw new Error(\`Transcription failed: \${res.status}\`);`);
    lines.push(`    return res.json();`);
    lines.push(`  } finally {`);
    lines.push(`    clearTimeout(timeout);`);
    lines.push(`  }`);
    lines.push(`}`);
  }

  lines.push(``);
  return lines.join("\n");
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_integrateAI",
    "Scaffold AI API integration with provider config, error handling, and TypeScript types.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const libDir = join(root, "lib");
        mkdirSync(libDir, { recursive: true });

        const clientFile = join(libDir, "ai.ts");
        if (existsSync(clientFile)) {
          return errorResponse(
            new Error(
              `AI client already exists at ${clientFile}. Delete it first or edit manually.`,
            ),
          );
        }

        const code = generateClientCode(args.provider, args.features);
        writeFileSync(clientFile, code);

        const result = {
          success: true,
          provider: args.provider,
          features: args.features,
          file_created: clientFile,
          next_steps: [
            "Set EXPO_PUBLIC_AI_PROXY_URL in your .env to point to your backend proxy",
            "Deploy a backend that proxies requests to the AI provider and holds the API key",
            "Never bundle AI provider API keys directly in the mobile app",
            args.features.includes("vision")
              ? "Install expo-camera for vision features: npx expo install expo-camera"
              : null,
            args.features.includes("audio")
              ? "Install expo-av for audio recording: npx expo install expo-av"
              : null,
          ].filter(Boolean),
        };

        return textResponse(JSON.stringify(result, null, 2));
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}
