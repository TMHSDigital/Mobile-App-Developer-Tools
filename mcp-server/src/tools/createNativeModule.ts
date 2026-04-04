import { z } from "zod";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the project root. Defaults to cwd."),
  framework: z
    .enum(["expo", "flutter"])
    .optional()
    .default("expo")
    .describe("Framework (default: expo)."),
  module_name: z
    .string()
    .describe("Name of the native module (PascalCase, e.g. 'Haptics')."),
  output_directory: z
    .string()
    .optional()
    .default("modules")
    .describe("Output directory relative to project root (default: modules)."),
};

function toPascalCase(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function toKebabCase(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function generateExpoModuleIndex(name: string): string {
  return `import ${name}Module from "./${name}Module";

export function hello(): string {
  return ${name}Module.hello();
}

export function multiply(a: number, b: number): number {
  return ${name}Module.multiply(a, b);
}
`;
}

function generateExpoModuleNative(name: string): string {
  return `import { requireNativeModule } from "expo-modules-core";

const ${name}Module = requireNativeModule("${name}");

export default ${name}Module;
`;
}

function generateExpoModuleConfig(name: string): string {
  return `{
  "name": "${name}",
  "platforms": ["ios", "android"],
  "ios": {
    "modules": ["${name}Module"]
  },
  "android": {
    "modules": ["${name}Module"]
  }
}
`;
}

function generateSwiftModule(name: string): string {
  return `import ExpoModulesCore

public class ${name}Module: Module {
  public func definition() -> ModuleDefinition {
    Name("${name}")

    Function("hello") {
      return "Hello from ${name} native module!"
    }

    Function("multiply") { (a: Double, b: Double) -> Double in
      return a * b
    }
  }
}
`;
}

function generateKotlinModule(name: string): string {
  const pkg = `expo.modules.${name.toLowerCase()}`;
  return `package ${pkg}

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ${name}Module : Module() {
  override fun definition() = ModuleDefinition {
    Name("${name}")

    Function("hello") {
      "Hello from ${name} native module!"
    }

    Function("multiply") { a: Double, b: Double ->
      a * b
    }
  }
}
`;
}

function generateFlutterPluginDart(name: string): string {
  const snakeName = toKebabCase(name).replace(/-/g, "_");
  return `import 'dart:async';
import 'package:flutter/services.dart';

class ${name} {
  static const MethodChannel _channel = MethodChannel('${snakeName}');

  static Future<String> hello() async {
    final result = await _channel.invokeMethod<String>('hello');
    return result ?? '';
  }

  static Future<double> multiply(double a, double b) async {
    final result = await _channel.invokeMethod<double>('multiply', {
      'a': a,
      'b': b,
    });
    return result ?? 0;
  }
}
`;
}

function generateFlutterPlatformInterface(name: string): string {
  const snakeName = toKebabCase(name).replace(/-/g, "_");
  return `import 'package:flutter/services.dart';

class ${name}Platform {
  static const MethodChannel _channel = MethodChannel('${snakeName}');

  Future<String> hello() async {
    final result = await _channel.invokeMethod<String>('hello');
    return result ?? '';
  }

  Future<double> multiply(double a, double b) async {
    final result = await _channel.invokeMethod<double>('multiply', {
      'a': a,
      'b': b,
    });
    return result ?? 0;
  }
}
`;
}

function generateSwiftPlugin(name: string): string {
  const snakeName = toKebabCase(name).replace(/-/g, "_");
  return `import Flutter
import UIKit

public class ${name}Plugin: NSObject, FlutterPlugin {
  public static func register(with registrar: FlutterPluginRegistrar) {
    let channel = FlutterMethodChannel(
      name: "${snakeName}",
      binaryMessenger: registrar.messenger()
    )
    let instance = ${name}Plugin()
    registrar.addMethodCallDelegate(instance, channel: channel)
  }

  public func handle(_ call: FlutterMethodCall, result: @escaping FlutterResult) {
    switch call.method {
    case "hello":
      result("Hello from ${name} native module!")
    case "multiply":
      guard let args = call.arguments as? [String: Any],
            let a = args["a"] as? Double,
            let b = args["b"] as? Double else {
        result(FlutterError(code: "INVALID_ARGS", message: "Expected a and b", details: nil))
        return
      }
      result(a * b)
    default:
      result(FlutterMethodNotImplemented)
    }
  }
}
`;
}

function generateKotlinPlugin(name: string): string {
  const snakeName = toKebabCase(name).replace(/-/g, "_");
  return `package com.example.${snakeName}

import io.flutter.embedding.engine.plugins.FlutterPlugin
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

class ${name}Plugin : FlutterPlugin, MethodChannel.MethodCallHandler {
  private lateinit var channel: MethodChannel

  override fun onAttachedToEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    channel = MethodChannel(binding.binaryMessenger, "${snakeName}")
    channel.setMethodCallHandler(this)
  }

  override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
    when (call.method) {
      "hello" -> result.success("Hello from ${name} native module!")
      "multiply" -> {
        val a = call.argument<Double>("a") ?: return result.error("INVALID_ARGS", "Missing a", null)
        val b = call.argument<Double>("b") ?: return result.error("INVALID_ARGS", "Missing b", null)
        result.success(a * b)
      }
      else -> result.notImplemented()
    }
  }

  override fun onDetachedFromEngine(binding: FlutterPlugin.FlutterPluginBinding) {
    channel.setMethodCallHandler(null)
  }
}
`;
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_createNativeModule",
    "Scaffold an Expo Module or Flutter platform plugin with Swift/Kotlin stubs and TypeScript/Dart bindings.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const name = toPascalCase(args.module_name);
        const kebab = toKebabCase(name);
        const isFlutter = args.framework === "flutter";
        const moduleDir = join(root, args.output_directory, kebab);

        if (existsSync(moduleDir)) {
          return errorResponse(new Error(`Module directory already exists: ${moduleDir}`));
        }

        const created: string[] = [];

        if (isFlutter) {
          const libDir = join(moduleDir, "lib");
          const iosDir = join(moduleDir, "ios", "Classes");
          const androidDir = join(moduleDir, "android", "src", "main", "kotlin", "com", "example", kebab.replace(/-/g, "_"));
          mkdirSync(libDir, { recursive: true });
          mkdirSync(iosDir, { recursive: true });
          mkdirSync(androidDir, { recursive: true });

          const files: Array<{ path: string; content: string }> = [
            { path: join(libDir, `${kebab.replace(/-/g, "_")}.dart`), content: generateFlutterPluginDart(name) },
            { path: join(libDir, `${kebab.replace(/-/g, "_")}_platform.dart`), content: generateFlutterPlatformInterface(name) },
            { path: join(iosDir, `${name}Plugin.swift`), content: generateSwiftPlugin(name) },
            { path: join(androidDir, `${name}Plugin.kt`), content: generateKotlinPlugin(name) },
          ];

          for (const f of files) {
            writeFileSync(f.path, f.content, "utf-8");
            created.push(f.path);
          }
        } else {
          const srcDir = join(moduleDir, "src");
          const iosDir = join(moduleDir, "ios");
          const androidDir = join(moduleDir, "android", "src", "main", "java", "expo", "modules", name.toLowerCase());
          mkdirSync(srcDir, { recursive: true });
          mkdirSync(iosDir, { recursive: true });
          mkdirSync(androidDir, { recursive: true });

          const files: Array<{ path: string; content: string }> = [
            { path: join(srcDir, "index.ts"), content: generateExpoModuleIndex(name) },
            { path: join(srcDir, `${name}Module.ts`), content: generateExpoModuleNative(name) },
            { path: join(moduleDir, "expo-module.config.json"), content: generateExpoModuleConfig(name) },
            { path: join(iosDir, `${name}Module.swift`), content: generateSwiftModule(name) },
            { path: join(androidDir, `${name}Module.kt`), content: generateKotlinModule(name) },
          ];

          for (const f of files) {
            writeFileSync(f.path, f.content, "utf-8");
            created.push(f.path);
          }
        }

        const nextSteps: string[] = isFlutter
          ? [
              `Add the plugin to pubspec.yaml as a path dependency: path: ${args.output_directory}/${kebab}`,
              "Run flutter pub get",
              "Import and call the module from Dart code",
              "Customize Swift and Kotlin implementations for your use case",
            ]
          : [
              `Import from "${args.output_directory}/${kebab}/src" in your app code`,
              "Run npx expo prebuild to generate native projects",
              "Customize the Swift and Kotlin Module definitions",
              "Add new native functions following the existing pattern",
            ];

        return textResponse(
          JSON.stringify(
            {
              success: true,
              framework: args.framework,
              module_name: name,
              files_created: created,
              next_steps: nextSteps,
            },
            null,
            2,
          ),
        );
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}
