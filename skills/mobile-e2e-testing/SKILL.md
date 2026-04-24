---
name: mobile-e2e-testing
description: Set up end-to-end testing for React Native/Expo or Flutter apps. Covers Detox, Maestro, Patrol, device farm integration, CI pipeline setup, and flaky test mitigation. Use when the user wants automated tests that run on a real device or emulator and verify full user flows.
standards-version: 1.6.3
---

# Mobile E2E Testing

## Trigger

Use this skill when the user:

- Wants automated tests that tap buttons, fill forms, and verify screens on a device or emulator
- Asks about Detox, Maestro, or Patrol
- Needs to test full user flows like onboarding, login, or checkout
- Mentions "end-to-end", "e2e", "integration test on device", "device farm", or "UI automation"
- Wants to run automated tests in CI against real devices

## Required Inputs

- **Framework**: Expo (React Native) or Flutter
- **E2E tool**: Detox, Maestro (recommended for ease of use), or Patrol (Flutter)
- **Target platform**: iOS, Android, or both

## Workflow

1. **Choose an E2E framework.** Each has trade-offs:

   | Tool | Framework | Language | CI difficulty | Flaky risk | Best for |
   |---|---|---|---|---|---|
   | Maestro | RN + Flutter | YAML flows | Low | Low | Quick setup, readable flows |
   | Detox | React Native | JS/TS | Medium | Medium | Deep RN integration, gray-box |
   | Patrol | Flutter | Dart | Medium | Low | Native interaction in Flutter |

   Maestro is the fastest to set up and works across both frameworks. Detox provides deeper control for React Native. Patrol extends flutter_test with native OS interaction.

2. **Set up Maestro (recommended).** Install the CLI:

   ```bash
   # macOS
   brew install maestro

   # Windows / Linux
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```

   Create a flow file at `e2e/login.yaml`:

   ```yaml
   appId: com.yourapp
   ---
   - launchApp
   - tapOn: "Email"
   - inputText: "test@example.com"
   - tapOn: "Password"
   - inputText: "password123"
   - tapOn: "Sign In"
   - assertVisible: "Welcome"
   ```

   Run it:

   ```bash
   maestro test e2e/login.yaml
   ```

3. **Set up Detox (React Native).** Install Detox and its Jest adapter:

   ```bash
   npm install --save-dev detox @types/detox jest-circus
   npx detox init
   ```

   Configure `.detoxrc.js`:

   ```js
   module.exports = {
     testRunner: {
       args: { $0: "jest", config: "e2e/jest.config.js" },
       jest: { setupTimeout: 120000 },
     },
     apps: {
       "ios.debug": {
         type: "ios.app",
         binaryPath: "ios/build/Build/Products/Debug-iphonesimulator/YourApp.app",
         build: "xcodebuild -workspace ios/YourApp.xcworkspace -scheme YourApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build",
       },
       "android.debug": {
         type: "android.apk",
         binaryPath: "android/app/build/outputs/apk/debug/app-debug.apk",
         build: "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug",
       },
     },
     devices: {
       simulator: { type: "ios.simulator", device: { type: "iPhone 15" } },
       emulator: { type: "android.emulator", device: { avdName: "Pixel_7" } },
     },
     configurations: {
       "ios.sim.debug": { device: "simulator", app: "ios.debug" },
       "android.emu.debug": { device: "emulator", app: "android.debug" },
     },
   };
   ```

   Write a test in `e2e/login.test.ts`:

   ```ts
   describe("Login", () => {
     beforeAll(async () => {
       await device.launchApp();
     });

     it("signs in with valid credentials", async () => {
       await element(by.id("email-input")).typeText("test@example.com");
       await element(by.id("password-input")).typeText("password123");
       await element(by.id("sign-in-button")).tap();
       await expect(element(by.text("Welcome"))).toBeVisible();
     });
   });
   ```

   Run Detox:

   ```bash
   npx detox build --configuration ios.sim.debug
   npx detox test --configuration ios.sim.debug
   ```

4. **Set up Patrol (Flutter).** Add the dependency:

   ```yaml
   dev_dependencies:
     patrol: ^3.13.0
     patrol_finders: ^2.4.0
   ```

   Create `integration_test/login_test.dart`:

   ```dart
   import 'package:patrol/patrol.dart';
   import 'package:my_app/main.dart' as app;

   void main() {
     patrolTest('signs in with valid credentials', ($) async {
       app.main();
       await $.pumpAndSettle();

       await $(#emailInput).enterText('test@example.com');
       await $(#passwordInput).enterText('password123');
       await $(#signInButton).tap();
       await $.pumpAndSettle();

       expect($('Welcome'), findsOneWidget);
     });
   }
   ```

   Run it:

   ```bash
   patrol test --target integration_test/login_test.dart
   ```

5. **Add testIDs for reliable selectors.** In React Native, set `testID` props:

   ```tsx
   <TextInput testID="email-input" />
   <Pressable testID="sign-in-button">
     <Text>Sign In</Text>
   </Pressable>
   ```

   In Flutter, use `Key` values:

   ```dart
   TextField(key: const Key('emailInput'))
   ```

6. **Run E2E tests in CI.** For Maestro with GitHub Actions:

   ```yaml
   - name: Run E2E tests
     uses: mobile-dev-inc/action-maestro-cloud@v1
     with:
       api-key: ${{ secrets.MAESTRO_CLOUD_KEY }}
       app-file: app-release.apk
   ```

   For Detox, run on a macOS runner with a simulator:

   ```yaml
   jobs:
     e2e:
       runs-on: macos-latest
       steps:
       - uses: actions/checkout@v4
       - run: npm ci
       - run: npx detox build --configuration ios.sim.debug
       - run: npx detox test --configuration ios.sim.debug --cleanup
   ```

7. **Use a device farm for broader coverage.** Test on real devices across OS versions:

   | Service | Pricing | Integration |
   |---|---|---|
   | Maestro Cloud | Free tier available | `maestro cloud` CLI |
   | BrowserStack App Automate | Pay per minute | REST API or SDK |
   | AWS Device Farm | Pay per minute | AWS CLI |
   | Firebase Test Lab | Free Spark tier | `gcloud firebase test` |

## Key References

- [Maestro: Getting Started](https://maestro.mobile.dev/getting-started)
- [Detox: Introduction](https://wix.github.io/Detox/docs/introduction/getting-started)
- [Patrol: Getting Started](https://patrol.leancode.co/getting-started)
- [Maestro Cloud CI](https://maestro.mobile.dev/cloud/ci-integration)

## Example Interaction

**User:** "I want to add E2E tests for my login and checkout flows in my Expo app."

**Agent:**
1. Recommends Maestro for quick YAML-based flows
2. Installs Maestro CLI
3. Creates `e2e/login.yaml` with tap, input, and assert steps
4. Creates `e2e/checkout.yaml` covering product selection through payment confirmation
5. Adds `testID` props to key interactive elements in the login and checkout screens
6. Runs `maestro test e2e/` to validate both flows pass
7. Generates a GitHub Actions workflow step for Maestro Cloud with `mobile_setupCI`
8. Suggests adding the flows to PR checks for regression detection

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Generate CI workflow | `mobile_setupCI` | Create GitHub Actions workflow with E2E test step |
| Run unit tests first | `mobile_runTests` | Verify unit tests pass before running slower E2E tests |
| Install dependencies | `mobile_installDependency` | Install detox, patrol, or related packages |
| Check build health | `mobile_checkBuildHealth` | Ensure the app builds before running E2E tests |

## Common Pitfalls

1. **Missing testIDs** - E2E tests that rely on text selectors break when copy changes. Use `testID` (RN) or `Key` (Flutter) for stable selectors.
2. **Not waiting for animations** - Tapping during transitions causes flaky failures. Use `waitForVisible` (Maestro), `waitFor` (Detox), or `pumpAndSettle` (Patrol).
3. **Hardcoded test data** - Tests that depend on specific server state fail when the backend changes. Use test accounts, seed data, or mock APIs.
4. **Running E2E on every commit** - E2E tests are slow (minutes). Run them on PRs targeting main or on a nightly schedule, not on every push.
5. **Ignoring flaky tests** - A flaky test erodes trust in the suite. Fix or quarantine flaky tests immediately. Add retry logic only as a last resort.
6. **Detox requires a dev build** - Detox does not work with Expo Go. Use `npx expo prebuild` or EAS Build to create a dev client first.

## See Also

- [Mobile Testing](../mobile-testing/SKILL.md) - unit and integration testing with Jest and flutter_test
- [Mobile CI/CD](../mobile-ci-cd/SKILL.md) - run E2E tests in GitHub Actions pipelines
- [Mobile Run on Device](../mobile-run-on-device/SKILL.md) - running the app on a physical device for manual testing
