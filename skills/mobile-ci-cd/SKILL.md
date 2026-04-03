---
name: mobile-ci-cd
description: Set up CI/CD pipelines for React Native/Expo or Flutter apps. Covers GitHub Actions workflows, EAS Build integration, build caching, code signing in CI, secrets management, PR preview builds, and conditional platform builds. Use when the user wants automated builds, tests, or deployments on push or pull request.
---

# Mobile CI/CD

## Trigger

Use this skill when the user:

- Wants automated builds or tests on push or PR
- Asks about GitHub Actions, EAS Build, or CI/CD for mobile
- Needs code signing (certificates, keystores) in CI
- Mentions "continuous integration", "CI", "CD", "pipeline", "automated build", "github actions", or "deploy on merge"
- Wants PR preview builds or staged deployment

## Required Inputs

- **Framework**: Expo (React Native) or Flutter
- **CI provider**: GitHub Actions (default and recommended)
- **Build targets**: iOS, Android, or both
- **Deployment target**: TestFlight, Play Console internal track, EAS Update, or none (CI only)

## Workflow

1. **Generate a basic CI workflow.** Use the MCP tool for a starter config:

   The `mobile_setupCI` tool creates `.github/workflows/ci.yml` with lint, type check, and test steps. Customize it after generation.

2. **Expo CI workflow structure.** A production-grade pipeline:

   ```yaml
   name: CI

   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]

   jobs:
     lint-and-test:
       runs-on: ubuntu-latest
       steps:
       - uses: actions/checkout@v4

       - uses: actions/setup-node@v4
         with:
           node-version: 20
           cache: npm

       - run: npm ci

       - name: Type check
         run: npx tsc --noEmit

       - name: Lint
         run: npx expo lint

       - name: Test
         run: npx jest --ci --coverage

     eas-build:
       needs: lint-and-test
       if: github.ref == 'refs/heads/main'
       runs-on: ubuntu-latest
       steps:
       - uses: actions/checkout@v4

       - uses: actions/setup-node@v4
         with:
           node-version: 20
           cache: npm

       - run: npm ci

       - uses: expo/expo-github-action@v8
         with:
           eas-version: latest
           token: ${{ secrets.EXPO_TOKEN }}

       - name: Build
         run: eas build --platform all --profile production --non-interactive
   ```

3. **Flutter CI workflow structure.**

   ```yaml
   name: CI

   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]

   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
       - uses: actions/checkout@v4

       - uses: subosito/flutter-action@v2
         with:
           channel: stable
           cache: true

       - run: flutter pub get
       - run: flutter analyze
       - run: flutter test --coverage

     build-android:
       needs: test
       if: github.ref == 'refs/heads/main'
       runs-on: ubuntu-latest
       steps:
       - uses: actions/checkout@v4

       - uses: subosito/flutter-action@v2
         with:
           channel: stable
           cache: true

       - run: flutter pub get
       - run: flutter build apk --release

     build-ios:
       needs: test
       if: github.ref == 'refs/heads/main'
       runs-on: macos-latest
       steps:
       - uses: actions/checkout@v4

       - uses: subosito/flutter-action@v2
         with:
           channel: stable
           cache: true

       - run: flutter pub get
       - run: flutter build ios --release --no-codesign
   ```

4. **Manage secrets for code signing.** Store credentials as GitHub encrypted secrets:

   | Secret | Purpose | How to get it |
   |---|---|---|
   | `EXPO_TOKEN` | EAS CLI auth | `eas credentials` or expo.dev dashboard |
   | `KEYSTORE_BASE64` | Android signing keystore | `base64 -i release.keystore` |
   | `KEYSTORE_PASSWORD` | Keystore password | From your key generation step |
   | `KEY_ALIAS` | Key alias | From your key generation step |
   | `KEY_PASSWORD` | Key password | From your key generation step |

   For Expo/EAS projects, code signing is managed by EAS. You only need `EXPO_TOKEN`.

   For bare React Native or Flutter, decode the keystore in CI:

   ```yaml
   - name: Decode keystore
     run: echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > android/app/release.keystore
   ```

5. **Cache dependencies for faster builds.** Node modules and Flutter SDK caching:

   ```yaml
   # Node (already handled by setup-node cache: npm)
   - uses: actions/setup-node@v4
     with:
       node-version: 20
       cache: npm

   # Flutter (already handled by flutter-action cache: true)
   - uses: subosito/flutter-action@v2
     with:
       channel: stable
       cache: true

   # Gradle cache for Android builds
   - uses: actions/cache@v4
     with:
       path: |
         ~/.gradle/caches
         ~/.gradle/wrapper
       key: gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}

   # CocoaPods cache for iOS builds
   - uses: actions/cache@v4
     with:
       path: ios/Pods
       key: pods-${{ hashFiles('ios/Podfile.lock') }}
   ```

6. **Add PR preview builds with EAS.** Build a preview version on every PR:

   Add a `preview` profile in `eas.json`:

   ```json
   {
     "build": {
       "preview": {
         "distribution": "internal",
         "channel": "preview",
         "ios": { "simulator": true }
       }
     }
   }
   ```

   Add a workflow job:

   ```yaml
   preview:
     if: github.event_name == 'pull_request'
     runs-on: ubuntu-latest
     steps:
     - uses: actions/checkout@v4
     - uses: actions/setup-node@v4
       with:
         node-version: 20
         cache: npm
     - run: npm ci
     - uses: expo/expo-github-action@v8
       with:
         eas-version: latest
         token: ${{ secrets.EXPO_TOKEN }}
     - run: eas build --platform all --profile preview --non-interactive
   ```

7. **Conditional platform builds.** Only build the platform that changed:

   ```yaml
   changes:
     runs-on: ubuntu-latest
     outputs:
       ios: ${{ steps.filter.outputs.ios }}
       android: ${{ steps.filter.outputs.android }}
     steps:
     - uses: dorny/paths-filter@v3
       id: filter
       with:
         filters: |
           ios:
             - 'ios/**'
             - 'Podfile.lock'
           android:
             - 'android/**'
             - 'build.gradle'
   ```

8. **Deploy on merge.** Submit to stores automatically when merging to main:

   ```yaml
   deploy:
     needs: eas-build
     if: github.ref == 'refs/heads/main'
     runs-on: ubuntu-latest
     steps:
     - uses: actions/checkout@v4
     - uses: actions/setup-node@v4
       with:
         node-version: 20
         cache: npm
     - run: npm ci
     - uses: expo/expo-github-action@v8
       with:
         eas-version: latest
         token: ${{ secrets.EXPO_TOKEN }}
     - run: eas submit --platform all --profile production --non-interactive
   ```

## Key References

- [Expo: GitHub Actions](https://docs.expo.dev/build/building-on-ci/)
- [expo-github-action](https://github.com/expo/expo-github-action)
- [EAS Build profiles](https://docs.expo.dev/build/eas-json/)
- [Flutter: CI/CD](https://docs.flutter.dev/deployment/cd)
- [GitHub Actions: Encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## Example Interaction

**User:** "Set up CI for my Expo app. I want tests on every PR and a production build when I merge to main."

**Agent:**
1. Runs `mobile_setupCI` with framework=expo, platforms=both, include_tests=true, include_eas_build=true
2. Reviews the generated `.github/workflows/ci.yml`
3. Adds a preview build job that triggers on pull_request
4. Adds Gradle and CocoaPods cache steps for faster builds
5. Instructs user to add `EXPO_TOKEN` secret in GitHub repo settings
6. Suggests adding branch protection rules requiring the `lint-and-test` job to pass
7. Commits the workflow file

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Generate workflow | `mobile_setupCI` | Create GitHub Actions CI/CD workflow file |
| Run tests locally first | `mobile_runTests` | Verify tests pass before pushing to CI |
| Validate build config | `mobile_checkBuildHealth` | Check that app.json and dependencies are valid |
| Build for store | `mobile_buildForStore` | Trigger a production EAS Build locally or in CI |
| Submit to stores | `mobile_submitToAppStore`, `mobile_submitToPlayStore` | Automate store submission from CI |

## Common Pitfalls

1. **Committing secrets to the repo** - Never hardcode `EXPO_TOKEN`, keystores, or API keys in workflow files. Use GitHub encrypted secrets.
2. **Using ubuntu for iOS builds** - iOS builds require macOS runners. Use `runs-on: macos-latest` for Xcode and simulator steps. EAS Build handles this for you.
3. **No dependency caching** - Without caching, `npm ci` and `flutter pub get` download everything on each run. Use the `cache` option in setup actions.
4. **Building on every push to every branch** - Limit triggers to `main` and pull requests. Building on feature branch pushes wastes CI minutes.
5. **Not pinning action versions** - Use `@v4` not `@latest` for third-party actions. Unpinned versions can break without warning.
6. **Skipping type checks in CI** - `npx tsc --noEmit` catches type errors that developers may ignore locally. Always include it.
7. **EAS Build timeout** - EAS Build can take 10-30 minutes. Set appropriate job timeouts and do not block PR merges on build completion.

## See Also

- [Mobile Testing](../mobile-testing/SKILL.md) - unit and integration test setup
- [Mobile E2E Testing](../mobile-e2e-testing/SKILL.md) - end-to-end tests to run in CI
- [Mobile iOS Submission](../mobile-ios-submission/SKILL.md) - EAS Submit for App Store
- [Mobile Android Submission](../mobile-android-submission/SKILL.md) - EAS Submit for Play Console
