#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { register as registerCheckDevEnvironment } from "./tools/checkDevEnvironment.js";
import { register as registerScaffoldProject } from "./tools/scaffoldProject.js";
import { register as registerRunOnDevice } from "./tools/runOnDevice.js";

const server = new McpServer({
  name: "mobile-mcp",
  version: "0.1.0",
});

registerCheckDevEnvironment(server);
registerScaffoldProject(server);
registerRunOnDevice(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
