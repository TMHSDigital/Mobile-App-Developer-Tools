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
import { register as registerBuildForStore } from "./tools/buildForStore.js";
import { register as registerValidateStoreMetadata } from "./tools/validateStoreMetadata.js";
import { register as registerSubmitToAppStore } from "./tools/submitToAppStore.js";
import { register as registerSubmitToPlayStore } from "./tools/submitToPlayStore.js";
import { register as registerGenerateScreenshots } from "./tools/generateScreenshots.js";
import { register as registerAnalyzeBundle } from "./tools/analyzeBundle.js";
import { register as registerConfigureOTA } from "./tools/configureOTA.js";
import { register as registerRunTests } from "./tools/runTests.js";
import { register as registerSetupCI } from "./tools/setupCI.js";
import { register as registerGenerateTestFile } from "./tools/generateTestFile.js";
import { register as registerSetupI18n } from "./tools/setupI18n.js";
import { register as registerAddMap } from "./tools/addMap.js";
import { register as registerGenerateForm } from "./tools/generateForm.js";
import { register as registerSetupRealtime } from "./tools/setupRealtime.js";

const server = new McpServer({
  name: "mobile-mcp",
  version: "0.9.0",
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
registerBuildForStore(server);
registerValidateStoreMetadata(server);
registerSubmitToAppStore(server);
registerSubmitToPlayStore(server);
registerGenerateScreenshots(server);
registerAnalyzeBundle(server);
registerConfigureOTA(server);
registerRunTests(server);
registerSetupCI(server);
registerGenerateTestFile(server);
registerSetupI18n(server);
registerAddMap(server);
registerGenerateForm(server);
registerSetupRealtime(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
