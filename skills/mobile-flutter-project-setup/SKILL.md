---
name: mobile-flutter-project-setup
description: Create a new Flutter project with recommended structure, linting, and packages. Covers flutter create, directory conventions, analysis_options.yaml, pubspec.yaml management, and flavors. Use when the user wants to start a new Flutter app.
standards-version: 1.6.3
---

# Flutter Project Setup

## Trigger

Use this skill when the user:

- Wants to create a new Flutter app from scratch
- Asks how to set up a Flutter project with good structure
- Needs help with `flutter create` options
- Wants recommended project structure or directory conventions
- Mentions "flutter create", "new Flutter project", "Flutter scaffold", or "Dart project"

## Required Inputs

- **App name**: lowercase_with_underscores (Dart package naming convention)
- **Platforms** (optional): ios, android, web, macos, linux, windows (defaults to ios + android)
- **Organization** (optional): reverse domain for bundle ID (e.g. `com.example`)

## Workflow

1. **Verify Flutter SDK.** Confirm Flutter is installed and on the PATH:

   ```bash
   flutter --version
   flutter doctor
   ```

   If not installed, direct the user to [flutter.dev/get-started](https://docs.flutter.dev/get-started/install). Minimum Flutter 3.22+ recommended for latest features.

2. **Create the project.**

   ```bash
   flutter create --org com.example --platforms ios,android my_app
   cd my_app
   ```

   For an empty starting point (no counter demo):

   ```bash
   flutter create --empty --org com.example my_app
   ```

3. **Set up recommended directory structure.** Reorganize `lib/`:

   ```
   lib/
   ├── main.dart                  # Entry point, app config
   ├── app.dart                   # MaterialApp / GoRouter setup
   ├── core/
   │   ├── constants.dart         # App-wide constants
   │   ├── theme.dart             # ThemeData definitions
   │   ├── router.dart            # GoRouter configuration
   │   └── extensions/            # Dart extension methods
   ├── features/
   │   ├── auth/
   │   │   ├── data/              # Repositories, data sources
   │   │   ├── domain/            # Models, entities
   │   │   └── presentation/      # Screens, widgets
   │   ├── home/
   │   │   ├── data/
   │   │   ├── domain/
   │   │   └── presentation/
   │   └── settings/
   │       └── presentation/
   └── shared/
       ├── widgets/               # Reusable UI components
       ├── utils/                 # Helper functions
       └── services/              # API clients, storage, etc.
   ```

   This is the feature-first architecture. Each feature is self-contained with its own data, domain, and presentation layers.

4. **Configure linting.** Replace the default `analysis_options.yaml`:

   ```yaml
   include: package:flutter_lints/flutter.yaml

   analyzer:
     errors:
       missing_required_param: error
       missing_return: error
     exclude:
       - "**/*.g.dart"
       - "**/*.freezed.dart"

   linter:
     rules:
       prefer_const_constructors: true
       prefer_const_declarations: true
       prefer_final_locals: true
       avoid_print: true
       require_trailing_commas: true
       sort_constructors_first: true
       unawaited_futures: true
       prefer_single_quotes: true
   ```

   Install the lints package:

   ```bash
   flutter pub add --dev flutter_lints
   ```

5. **Add recommended base packages.**

   ```bash
   # Navigation
   flutter pub add go_router

   # State management (pick one)
   flutter pub add flutter_riverpod riverpod_annotation
   flutter pub add --dev riverpod_generator build_runner

   # Code generation (immutable models)
   flutter pub add freezed_annotation json_annotation
   flutter pub add --dev freezed json_serializable build_runner

   # Environment config
   flutter pub add flutter_dotenv
   ```

   Run code generation after adding freezed/riverpod_generator:

   ```bash
   dart run build_runner build --delete-conflicting-outputs
   ```

6. **Set up flavors (optional).** For dev/staging/prod environments:

   Create `lib/core/env.dart`:

   ```dart
   enum Env { dev, staging, prod }

   class EnvConfig {
     final String apiBaseUrl;
     final Env env;

     const EnvConfig({required this.apiBaseUrl, required this.env});

     static const dev = EnvConfig(
       apiBaseUrl: 'https://api-dev.example.com',
       env: Env.dev,
     );

     static const staging = EnvConfig(
       apiBaseUrl: 'https://api-staging.example.com',
       env: Env.staging,
     );

     static const prod = EnvConfig(
       apiBaseUrl: 'https://api.example.com',
       env: Env.prod,
     );
   }
   ```

   Create separate entry points:

   ```
   lib/main_dev.dart      # runApp with EnvConfig.dev
   lib/main_staging.dart   # runApp with EnvConfig.staging
   lib/main.dart           # runApp with EnvConfig.prod
   ```

   Run with a specific flavor:

   ```bash
   flutter run -t lib/main_dev.dart
   ```

7. **Configure VS Code / Cursor.** Add `.vscode/settings.json`:

   ```json
   {
     "editor.formatOnSave": true,
     "dart.lineLength": 80,
     "[dart]": {
       "editor.defaultFormatter": "Dart-Code.dart-code",
       "editor.rulers": [80],
       "editor.selectionHighlight": false,
       "editor.suggestSelection": "first",
       "editor.tabCompletion": "onlySnippets",
       "editor.wordBasedSuggestions": "off"
     }
   }
   ```

## Key References

- [Flutter: Get started](https://docs.flutter.dev/get-started/install)
- [Flutter project structure](https://docs.flutter.dev/resources/architectural-overview)
- [Dart package naming conventions](https://dart.dev/tools/pub/pubspec#name)
- [flutter_lints](https://pub.dev/packages/flutter_lints)
- [GoRouter](https://pub.dev/packages/go_router)
- [Riverpod](https://riverpod.dev/)
- [Freezed](https://pub.dev/packages/freezed)

## Example Interaction

**User:** "I want to create a new Flutter app for a fitness tracker."

**Agent:**
1. Verifies Flutter SDK with `flutter doctor`
2. Runs `flutter create --org com.example --platforms ios,android fitness_tracker`
3. Restructures `lib/` into feature-first layout with `features/workouts/`, `features/profile/`, `features/stats/`
4. Adds `analysis_options.yaml` with strict linting
5. Installs go_router, flutter_riverpod, freezed
6. Creates `core/theme.dart` with Material 3 fitness-themed colors
7. Sets up `.vscode/settings.json` for Dart formatting

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Check environment | `mobile_checkDevEnvironment` | Verify Flutter SDK, Dart, Android SDK, Xcode are installed |
| Check build | `mobile_checkBuildHealth` | Verify the project builds after setup |

## Common Pitfalls

1. **Not using `--empty` flag** - The default counter app template adds boilerplate that most developers delete immediately. Use `--empty` for a clean start.
2. **Flat `lib/` structure** - Putting all files directly in `lib/` becomes unmanageable past 10 files. Use feature-first structure from day one.
3. **Ignoring `analysis_options.yaml`** - Default rules are too lenient. Enable `prefer_const_constructors`, `require_trailing_commas`, and `avoid_print` early.
4. **Forgetting `--delete-conflicting-outputs`** - `build_runner` will fail on subsequent runs without this flag. Always use it.
5. **Wrong package name format** - Dart packages must be `lowercase_with_underscores`. No hyphens, no camelCase.
6. **Missing `.gitignore` entries** - Ensure `*.g.dart`, `*.freezed.dart`, and `.dart_tool/` are NOT in `.gitignore` (generated files should be committed for CI). But `build/` and `.dart_tool/` should be ignored.

## See Also

- [Flutter Navigation](../mobile-flutter-navigation/SKILL.md) - GoRouter setup after project creation
- [Flutter State Management](../mobile-flutter-state-management/SKILL.md) - Riverpod/Bloc patterns
- [Flutter Run on Device](../mobile-flutter-run-on-device/SKILL.md) - deploying to physical hardware
