#!/usr/bin/env node

import { VERSION, PACKAGE_NAME } from "./index.js";

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "--help" || command === "-h") {
  console.log(`${PACKAGE_NAME} v${VERSION}`);
  console.log("");
  console.log("Usage: mobile-dev <command>");
  console.log("");
  console.log("Commands:");
  console.log("  check-env     Check development environment (coming soon)");
  console.log("  scaffold      Scaffold a new mobile project (coming soon)");
  console.log("  validate-store  Validate app store metadata (coming soon)");
  console.log("");
  console.log("Options:");
  console.log("  --help, -h    Show this help message");
  console.log("  --version, -v Show version");
  process.exit(0);
}

if (command === "--version" || command === "-v") {
  console.log(VERSION);
  process.exit(0);
}

console.log(`${PACKAGE_NAME} v${VERSION}`);
console.log(`Command "${command}" is not yet implemented. Coming in a future release.`);
console.log("See https://github.com/TMHSDigital/Mobile-App-Developer-Tools for updates.")

process.exit(1);
