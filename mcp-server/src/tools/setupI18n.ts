import { z } from "zod";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
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
    .describe("Project framework (default: expo)."),
  default_locale: z
    .string()
    .optional()
    .default("en")
    .describe("Default locale code (default: en)."),
  additional_locales: z
    .array(z.string())
    .optional()
    .default([])
    .describe("Additional locale codes to create placeholder files for (e.g. ['es', 'fr', 'de'])."),
};

function generateExpoI18nConfig(defaultLocale: string): string {
  return `import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import ${defaultLocale} from "./${defaultLocale}.json";

const deviceLocale = getLocales()[0]?.languageCode ?? "${defaultLocale}";

i18n.use(initReactI18next).init({
  resources: {
    ${defaultLocale}: { translation: ${defaultLocale} },
  },
  lng: deviceLocale,
  fallbackLng: "${defaultLocale}",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
`;
}

function generateLocaleJson(locale: string): string {
  return JSON.stringify(
    {
      common: {
        ok: locale === "en" ? "OK" : `[${locale}] OK`,
        cancel: locale === "en" ? "Cancel" : `[${locale}] Cancel`,
        save: locale === "en" ? "Save" : `[${locale}] Save`,
        delete: locale === "en" ? "Delete" : `[${locale}] Delete`,
        loading: locale === "en" ? "Loading..." : `[${locale}] Loading...`,
      },
      errors: {
        generic: locale === "en" ? "Something went wrong" : `[${locale}] Something went wrong`,
        network: locale === "en" ? "Check your internet connection" : `[${locale}] Check your internet connection`,
      },
    },
    null,
    2,
  );
}

function generateFlutterL10nYaml(defaultLocale: string): string {
  return `arb-dir: lib/l10n
template-arb-file: app_${defaultLocale}.arb
output-localization-file: app_localizations.dart
output-class: AppLocalizations
`;
}

function generateArbFile(locale: string): string {
  const data: Record<string, string> = {
    "@@locale": locale,
    ok: locale === "en" ? "OK" : `[${locale}] OK`,
    "@ok": JSON.stringify({ description: "Generic OK button label" }),
    cancel: locale === "en" ? "Cancel" : `[${locale}] Cancel`,
    "@cancel": JSON.stringify({ description: "Generic Cancel button label" }),
    save: locale === "en" ? "Save" : `[${locale}] Save`,
    "@save": JSON.stringify({ description: "Generic Save button label" }),
    errorGeneric: locale === "en" ? "Something went wrong" : `[${locale}] Something went wrong`,
    "@errorGeneric": JSON.stringify({ description: "Generic error message" }),
  };
  return JSON.stringify(data, null, 2);
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_setupI18n",
    "Initialize internationalization (i18n) config with locale files and translation structure. Supports i18next for Expo and flutter_localizations for Flutter.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const locales = [args.default_locale, ...args.additional_locales];
        const filesCreated: string[] = [];

        if (args.framework === "flutter") {
          const l10nDir = join(root, "lib", "l10n");
          mkdirSync(l10nDir, { recursive: true });

          const l10nYamlPath = join(root, "l10n.yaml");
          if (!existsSync(l10nYamlPath)) {
            writeFileSync(l10nYamlPath, generateFlutterL10nYaml(args.default_locale), "utf-8");
            filesCreated.push(l10nYamlPath);
          }

          for (const locale of locales) {
            const arbPath = join(l10nDir, `app_${locale}.arb`);
            if (!existsSync(arbPath)) {
              writeFileSync(arbPath, generateArbFile(locale), "utf-8");
              filesCreated.push(arbPath);
            }
          }

          return textResponse(
            JSON.stringify(
              {
                success: true,
                framework: "flutter",
                files_created: filesCreated,
                default_locale: args.default_locale,
                locales,
                next_steps: [
                  "Add flutter_localizations to pubspec.yaml dependencies",
                  "Add generate: true to pubspec.yaml",
                  "Import and add AppLocalizations.delegate to MaterialApp localizationsDelegates",
                  "Add AppLocalizations.supportedLocales to MaterialApp supportedLocales",
                  "Run flutter gen-l10n to generate the dart files",
                  "Use AppLocalizations.of(context)!.ok in your widgets",
                ],
              },
              null,
              2,
            ),
          );
        }

        const i18nDir = join(root, "i18n");
        mkdirSync(i18nDir, { recursive: true });

        for (const locale of locales) {
          const localePath = join(i18nDir, `${locale}.json`);
          if (!existsSync(localePath)) {
            writeFileSync(localePath, generateLocaleJson(locale) + "\n", "utf-8");
            filesCreated.push(localePath);
          }
        }

        const configPath = join(i18nDir, "index.ts");
        if (!existsSync(configPath)) {
          writeFileSync(configPath, generateExpoI18nConfig(args.default_locale), "utf-8");
          filesCreated.push(configPath);
        }

        return textResponse(
          JSON.stringify(
            {
              success: true,
              framework: "expo",
              files_created: filesCreated,
              default_locale: args.default_locale,
              locales,
              next_steps: [
                "Install dependencies: npx expo install i18next react-i18next expo-localization",
                'Import i18n config in your app entry: import "./i18n"',
                'Use translations: const { t } = useTranslation(); t("common.ok")',
                "Add more locale files to i18n/ for each supported language",
                "Consider i18next-parser for extracting strings from code",
              ],
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
