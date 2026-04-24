---
name: mobile-i18n
description: Add internationalization (i18n) to a React Native/Expo or Flutter app. Covers i18next, react-intl, flutter_localizations, locale detection, RTL layout, pluralization, date/number formatting, translation file structure, and CI string extraction. Use when the user wants to support multiple languages or localize the app for different markets.
standards-version: 1.6.3
---

# Mobile Internationalization

## Trigger

Use this skill when the user:

- Wants to support multiple languages in their app
- Asks about i18n, localization, or translations
- Needs RTL (right-to-left) layout support for Arabic, Hebrew, or similar
- Mentions "internationalization", "localization", "translate", "multi-language", "locale", "RTL", or "pluralization"
- Wants to format dates, numbers, or currencies for different regions

## Required Inputs

- **Framework**: Expo (React Native) or Flutter
- **i18n library**: i18next (recommended for RN), react-intl, or flutter_localizations
- **Default locale**: e.g. `en`
- **Target locales**: list of additional languages to support

## Workflow

1. **Choose an i18n approach.** Options for each framework:

   | Library | Framework | Pluralization | ICU | Extraction tools |
   |---|---|---|---|---|
   | i18next + react-i18next | React Native | Yes | Plugin | i18next-parser |
   | react-intl (FormatJS) | React Native | Yes (ICU) | Native | formatjs CLI |
   | flutter_localizations + intl | Flutter | Yes (ICU) | Native | gen-l10n |

   i18next is the most popular for React Native with good TypeScript support. flutter_localizations is the official Flutter solution.

2. **Set up i18next (Expo).** Install dependencies:

   ```bash
   npx expo install i18next react-i18next expo-localization
   ```

   Create the i18n directory structure:

   ```
   i18n/
     en.json
     es.json
     index.ts
   ```

   Initialize in `i18n/index.ts`:

   ```tsx
   import i18n from "i18next";
   import { initReactI18next } from "react-i18next";
   import { getLocales } from "expo-localization";
   import en from "./en.json";
   import es from "./es.json";

   const deviceLocale = getLocales()[0]?.languageCode ?? "en";

   i18n.use(initReactI18next).init({
     resources: {
       en: { translation: en },
       es: { translation: es },
     },
     lng: deviceLocale,
     fallbackLng: "en",
     interpolation: { escapeValue: false },
   });

   export default i18n;
   ```

3. **Structure translation files.** Use nested keys for organization:

   ```json
   {
     "common": {
       "ok": "OK",
       "cancel": "Cancel",
       "save": "Save"
     },
     "auth": {
       "signIn": "Sign In",
       "signUp": "Sign Up",
       "forgotPassword": "Forgot Password?"
     },
     "errors": {
       "network": "Check your internet connection",
       "generic": "Something went wrong"
     }
   }
   ```

4. **Use translations in components.**

   ```tsx
   import { useTranslation } from "react-i18next";

   function LoginScreen() {
     const { t } = useTranslation();

     return (
       <View>
         <Text>{t("auth.signIn")}</Text>
         <Button title={t("common.ok")} onPress={handleSubmit} />
       </View>
     );
   }
   ```

5. **Handle pluralization.** i18next supports count-based plurals:

   ```json
   {
     "items": {
       "count_one": "{{count}} item",
       "count_other": "{{count}} items"
     }
   }
   ```

   ```tsx
   t("items.count", { count: 5 })  // "5 items"
   t("items.count", { count: 1 })  // "1 item"
   ```

6. **Format dates and numbers.** Use the Intl API:

   ```tsx
   const formatDate = (date: Date, locale: string) =>
     new Intl.DateTimeFormat(locale, {
       year: "numeric",
       month: "long",
       day: "numeric",
     }).format(date);

   const formatCurrency = (amount: number, locale: string, currency: string) =>
     new Intl.NumberFormat(locale, {
       style: "currency",
       currency,
     }).format(amount);
   ```

7. **Support RTL layout.** React Native handles RTL automatically when the locale is RTL. Force it for testing:

   ```tsx
   import { I18nManager } from "react-native";

   I18nManager.forceRTL(true);
   ```

   Use `start`/`end` instead of `left`/`right` in styles:

   ```tsx
   const styles = StyleSheet.create({
     container: {
       paddingStart: 16,
       marginEnd: 8,
     },
   });
   ```

8. **Set up Flutter localization.** Create `l10n.yaml` in the project root:

   ```yaml
   arb-dir: lib/l10n
   template-arb-file: app_en.arb
   output-localization-file: app_localizations.dart
   ```

   Create `lib/l10n/app_en.arb`:

   ```json
   {
     "@@locale": "en",
     "ok": "OK",
     "@ok": { "description": "OK button label" },
     "itemCount": "{count, plural, =1{1 item} other{{count} items}}",
     "@itemCount": { "placeholders": { "count": { "type": "int" } } }
   }
   ```

   Run code generation:

   ```bash
   flutter gen-l10n
   ```

   Use in widgets:

   ```dart
   Text(AppLocalizations.of(context)!.ok)
   Text(AppLocalizations.of(context)!.itemCount(5))
   ```

9. **Add a language switcher.** Let users override the device language:

   ```tsx
   import i18n from "../i18n";
   import AsyncStorage from "@react-native-async-storage/async-storage";

   async function changeLanguage(locale: string) {
     await i18n.changeLanguage(locale);
     await AsyncStorage.setItem("user-locale", locale);
   }
   ```

## Key References

- [i18next: React Native](https://react.i18next.com/)
- [expo-localization](https://docs.expo.dev/versions/latest/sdk/localization/)
- [FormatJS (react-intl)](https://formatjs.io/docs/react-intl/)
- [Flutter: Internationalization](https://docs.flutter.dev/ui/accessibility-and-internationalization/internationalization)
- [ICU Message Syntax](https://unicode-org.github.io/icu/userguide/format_parse/messages/)

## Example Interaction

**User:** "I want my app in English and Spanish with proper pluralization."

**Agent:**
1. Runs `mobile_setupI18n` with default_locale=en, additional_locales=["es"]
2. Installs i18next, react-i18next, expo-localization with `mobile_installDependency`
3. Creates `i18n/en.json` and `i18n/es.json` with matching key structure
4. Creates `i18n/index.ts` with device locale detection and fallback
5. Imports `./i18n` in the app entry point
6. Refactors one screen to use `const { t } = useTranslation()`
7. Adds pluralization rules for count-based strings
8. Suggests i18next-parser for extracting untranslated strings in CI

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Initialize i18n | `mobile_setupI18n` | Create i18n config, locale files, and init module |
| Install packages | `mobile_installDependency` | Install i18next, react-i18next, expo-localization |
| Generate screen | `mobile_generateScreen` | Create a language settings screen |
| Verify build | `mobile_checkBuildHealth` | Ensure the app builds with i18n setup |

## Common Pitfalls

1. **Hardcoded strings** - Every user-facing string must go through `t()` or `AppLocalizations`. Use the `mobile-i18n-strings` rule to catch hardcoded text.
2. **Missing pluralization** - English has 2 plural forms but other languages (Arabic, Polish) have 6. Use ICU plural syntax, not string concatenation.
3. **RTL layout breaks** - Using `left`/`right` instead of `start`/`end` in styles breaks RTL layouts. Test with `I18nManager.forceRTL(true)`.
4. **String concatenation for sentences** - `"Hello " + name` breaks in languages where word order differs. Use interpolation: `t("greeting", { name })`.
5. **Date/number locale mismatch** - Format dates and currencies with the user's locale, not the translation locale. A Spanish-speaking user in the US expects USD formatting.
6. **Missing translations at runtime** - i18next shows the key path when a translation is missing. Set up CI checks to catch missing keys before release.

## See Also

- [Mobile Forms Validation](../mobile-forms-validation/SKILL.md) - localized validation error messages
- [Mobile App Store Prep](../mobile-app-store-prep/SKILL.md) - localized store listings and metadata
- [Mobile Analytics](../mobile-analytics/SKILL.md) - track locale distribution for prioritizing translations
