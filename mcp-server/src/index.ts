#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { register as registerCheckDevEnvironment } from "./tools/checkDevEnvironment.js";
import { register as registerScaffoldProject } from "./tools/scaffoldProject.js";
import { register as registerRunOnDevice } from "./tools/runOnDevice.js";
import { register as registerGenerateScreen } from "./tools/generateScreen.js";
import { register as registerGenerateComponent } from "./tools/generateComponent.js";
import { register as registerInstallDependency } from "./tools/installDependency.js";
import { register as registerAddPermission } from "./tools/addPermission.js";
import { register as registerIntegrateAI } from "./tools/integrateAI.js";
import { register as registerCheckBuildHealth } from "./tools/checkBuildHealth.js";
import { register as registerAddPushNotifications } from "./tools/addPushNotifications.js";
import { register as registerConfigureDeepLinks } from "./tools/configureDeepLinks.js";
import { register as registerResetDevEnvironment } from "./tools/resetDevEnvironment.js";

const server = new McpServer({
  name: "mobile-mcp",
  version: "0.4.0",
});

registerCheckDevEnvironment(server);
registerScaffoldProject(server);
registerRunOnDevice(server);
registerGenerateScreen(server);
registerGenerateComponent(server);
registerInstallDependency(server);
registerAddPermission(server);
registerIntegrateAI(server);
registerCheckBuildHealth(server);
registerAddPushNotifications(server);
registerConfigureDeepLinks(server);
registerResetDevEnvironment(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
