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
  output_directory: z
    .string()
    .optional()
    .default("lib")
    .describe("Output directory relative to project root (default: lib)."),
};

function generateExpoTokens(): string {
  return `export const colors = {
  light: {
    primary: "#0A84FF",
    primaryContainer: "#D6E4FF",
    background: "#FFFFFF",
    surface: "#F2F2F7",
    surfaceVariant: "#E5E5EA",
    text: "#000000",
    textSecondary: "#3C3C43",
    textTertiary: "#8E8E93",
    border: "#C6C6C8",
    error: "#FF3B30",
    success: "#34C759",
    warning: "#FF9500",
  },
  dark: {
    primary: "#0A84FF",
    primaryContainer: "#003A70",
    background: "#000000",
    surface: "#1C1C1E",
    surfaceVariant: "#2C2C2E",
    text: "#FFFFFF",
    textSecondary: "#EBEBF5",
    textTertiary: "#8E8E93",
    border: "#38383A",
    error: "#FF453A",
    success: "#30D158",
    warning: "#FF9F0A",
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  largeTitle: { fontSize: 34, lineHeight: 41, fontWeight: "700" as const },
  title1: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const },
  title2: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const },
  title3: { fontSize: 20, lineHeight: 25, fontWeight: "600" as const },
  headline: { fontSize: 17, lineHeight: 22, fontWeight: "600" as const },
  body: { fontSize: 17, lineHeight: 22, fontWeight: "400" as const },
  callout: { fontSize: 16, lineHeight: 21, fontWeight: "400" as const },
  subheadline: { fontSize: 15, lineHeight: 20, fontWeight: "400" as const },
  footnote: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  caption1: { fontSize: 12, lineHeight: 16, fontWeight: "400" as const },
  caption2: { fontSize: 11, lineHeight: 13, fontWeight: "400" as const },
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export type ColorScheme = "light" | "dark";
export type Colors = typeof colors.light;
`;
}

function generateExpoThemeProvider(): string {
  return `import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, spacing, typography, radii, type ColorScheme, type Colors } from "./tokens";

const THEME_STORAGE_KEY = "@app_theme_preference";

interface ThemeContextValue {
  colorScheme: ColorScheme;
  colors: Colors;
  spacing: typeof spacing;
  typography: typeof typography;
  radii: typeof radii;
  setColorScheme: (scheme: ColorScheme | "system") => void;
  isSystem: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useSystemColorScheme() ?? "light";
  const [preference, setPreference] = useState<ColorScheme | "system">("system");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setPreference(stored);
      }
      setLoaded(true);
    });
  }, []);

  const colorScheme: ColorScheme = preference === "system" ? systemScheme : preference;

  const setColorScheme = (scheme: ColorScheme | "system") => {
    setPreference(scheme);
    AsyncStorage.setItem(THEME_STORAGE_KEY, scheme);
  };

  if (!loaded) return null;

  return (
    <ThemeContext.Provider
      value={{
        colorScheme,
        colors: colors[colorScheme],
        spacing,
        typography,
        radii,
        setColorScheme,
        isSystem: preference === "system",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
`;
}

function generateFlutterTokens(): string {
  return `import 'package:flutter/material.dart';

abstract class AppColors {
  static const light = _LightColors();
  static const dark = _DarkColors();
}

class _LightColors {
  const _LightColors();
  Color get primary => const Color(0xFF0A84FF);
  Color get primaryContainer => const Color(0xFFD6E4FF);
  Color get background => const Color(0xFFFFFFFF);
  Color get surface => const Color(0xFFF2F2F7);
  Color get surfaceVariant => const Color(0xFFE5E5EA);
  Color get onSurface => const Color(0xFF000000);
  Color get onSurfaceVariant => const Color(0xFF3C3C43);
  Color get outline => const Color(0xFFC6C6C8);
  Color get error => const Color(0xFFFF3B30);
  Color get success => const Color(0xFF34C759);
  Color get warning => const Color(0xFFFF9500);
}

class _DarkColors {
  const _DarkColors();
  Color get primary => const Color(0xFF0A84FF);
  Color get primaryContainer => const Color(0xFF003A70);
  Color get background => const Color(0xFF000000);
  Color get surface => const Color(0xFF1C1C1E);
  Color get surfaceVariant => const Color(0xFF2C2C2E);
  Color get onSurface => const Color(0xFFFFFFFF);
  Color get onSurfaceVariant => const Color(0xFFEBEBF5);
  Color get outline => const Color(0xFF38383A);
  Color get error => const Color(0xFFFF453A);
  Color get success => const Color(0xFF30D158);
  Color get warning => const Color(0xFFFF9F0A);
}

abstract class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
}

abstract class AppRadii {
  static const double sm = 4;
  static const double md = 8;
  static const double lg = 12;
  static const double xl = 16;
  static const double full = 9999;
}
`;
}

function generateFlutterTheme(): string {
  return `import 'package:flutter/material.dart';
import 'tokens.dart';

class AppTheme {
  static ThemeData light() {
    final colors = AppColors.light;
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.light(
        primary: colors.primary,
        primaryContainer: colors.primaryContainer,
        surface: colors.surface,
        surfaceContainerHighest: colors.surfaceVariant,
        onSurface: colors.onSurface,
        onSurfaceVariant: colors.onSurfaceVariant,
        outline: colors.outline,
        error: colors.error,
      ),
      scaffoldBackgroundColor: colors.background,
    );
  }

  static ThemeData dark() {
    final colors = AppColors.dark;
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.dark(
        primary: colors.primary,
        primaryContainer: colors.primaryContainer,
        surface: colors.surface,
        surfaceContainerHighest: colors.surfaceVariant,
        onSurface: colors.onSurface,
        onSurfaceVariant: colors.onSurfaceVariant,
        outline: colors.outline,
        error: colors.error,
      ),
      scaffoldBackgroundColor: colors.background,
    );
  }
}
`;
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_setupTheming",
    "Initialize a design token system with light/dark themes, semantic colors, spacing, typography, and persistent theme preference.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const outDir = join(root, args.output_directory, "theme");
        mkdirSync(outDir, { recursive: true });

        const isFlutter = args.framework === "flutter";
        const ext = isFlutter ? "dart" : "ts";
        const files: Array<{ name: string; content: string }> = [];

        if (isFlutter) {
          files.push(
            { name: `tokens.${ext}`, content: generateFlutterTokens() },
            { name: `theme.${ext}`, content: generateFlutterTheme() },
          );
        } else {
          files.push(
            { name: `tokens.${ext}`, content: generateExpoTokens() },
            { name: `theme-provider.${ext}x`, content: generateExpoThemeProvider() },
          );
        }

        const created: string[] = [];
        const skipped: string[] = [];

        for (const file of files) {
          const filePath = join(outDir, file.name);
          if (existsSync(filePath)) {
            skipped.push(filePath);
          } else {
            writeFileSync(filePath, file.content, "utf-8");
            created.push(filePath);
          }
        }

        const nextSteps: string[] = [];
        if (isFlutter) {
          nextSteps.push(
            "Use AppTheme.light() and AppTheme.dark() in MaterialApp's theme and darkTheme",
            "Access colors via Theme.of(context).colorScheme",
            "Use AppSpacing and AppRadii constants for consistent layout",
            "Add shared_preferences for persistent theme preference",
          );
        } else {
          nextSteps.push(
            "Install @react-native-async-storage/async-storage for theme persistence",
            "Wrap your root layout with <ThemeProvider>",
            "Use const { colors, spacing } = useTheme() in components",
            "Use colorScheme for StatusBar and NavigationBar styling",
          );
        }

        return textResponse(
          JSON.stringify(
            {
              success: true,
              framework: args.framework,
              files_created: created,
              files_skipped: skipped,
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
