---
name: mobile-testing
description: Set up unit and integration testing for React Native/Expo or Flutter apps. Covers Jest, React Native Testing Library, flutter_test, snapshot testing, mocking native modules, and test organization. Use when the user wants to add or improve tests for components, hooks, or business logic.
standards-version: 1.6.3
---

# Mobile Testing

## Trigger

Use this skill when the user:

- Wants to add unit or integration tests to their app
- Asks about Jest, React Native Testing Library, or flutter_test
- Needs to test components, hooks, utilities, or state management
- Mentions "testing", "unit test", "snapshot test", "test coverage", or "mock"
- Wants help structuring test files or writing assertions

## Required Inputs

- **Framework**: Expo (React Native) or Flutter
- **Test scope**: components, hooks, utilities, or all
- **Existing test setup**: none, partial, or already configured

## Workflow

1. **Install test dependencies (Expo).** Expo projects need Jest and React Native Testing Library:

   ```bash
   npx expo install jest jest-expo @testing-library/react-native @testing-library/jest-native
   ```

   Add the Jest config to `package.json`:

   ```json
   {
     "jest": {
       "preset": "jest-expo",
       "setupFilesAfterSetup": ["@testing-library/jest-native/extend-expect"],
       "transformIgnorePatterns": [
         "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)"
       ]
     }
   }
   ```

2. **Install test dependencies (Flutter).** Flutter ships with `flutter_test`. For additional matchers:

   ```yaml
   dev_dependencies:
     flutter_test:
       sdk: flutter
     mocktail: ^1.0.4
   ```

3. **Organize test files.** Follow the convention for each framework:

   | Framework | Convention | Example |
   |---|---|---|
   | Expo | `__tests__/ComponentName.test.tsx` next to source | `components/__tests__/Avatar.test.tsx` |
   | Expo (colocated) | `ComponentName.test.tsx` in the same directory | `components/Avatar.test.tsx` |
   | Flutter | Mirror `lib/` structure under `test/` | `test/widgets/avatar_test.dart` |

4. **Write a component test (Expo).** Test rendering and interaction:

   ```tsx
   import { render, screen, fireEvent } from "@testing-library/react-native";
   import { Counter } from "../Counter";

   describe("Counter", () => {
     it("renders the initial count", () => {
       render(<Counter initialCount={5} />);
       expect(screen.getByText("5")).toBeTruthy();
     });

     it("increments on press", () => {
       render(<Counter initialCount={0} />);
       fireEvent.press(screen.getByRole("button", { name: "Increment" }));
       expect(screen.getByText("1")).toBeTruthy();
     });
   });
   ```

5. **Write a widget test (Flutter).**

   ```dart
   import 'package:flutter_test/flutter_test.dart';
   import 'package:my_app/widgets/counter.dart';

   void main() {
     testWidgets('Counter increments on tap', (tester) async {
       await tester.pumpWidget(const MaterialApp(home: Counter(initialCount: 0)));
       expect(find.text('0'), findsOneWidget);

       await tester.tap(find.byIcon(Icons.add));
       await tester.pump();
       expect(find.text('1'), findsOneWidget);
     });
   }
   ```

6. **Mock native modules.** Many Expo modules need mocks in `jest.setup.js`:

   ```js
   jest.mock("expo-camera", () => ({
     Camera: "Camera",
     useCameraPermissions: () => [{ granted: true }, jest.fn()],
   }));

   jest.mock("@react-native-async-storage/async-storage", () =>
     require("@react-native-async-storage/async-storage/jest/async-storage-mock")
   );
   ```

   Reference the setup file in your Jest config:

   ```json
   {
     "jest": {
       "setupFiles": ["./jest.setup.js"]
     }
   }
   ```

7. **Test custom hooks.** Use `renderHook` from React Native Testing Library:

   ```tsx
   import { renderHook, act } from "@testing-library/react-native";
   import { useCounter } from "../useCounter";

   it("increments the counter", () => {
     const { result } = renderHook(() => useCounter(0));
     act(() => result.current.increment());
     expect(result.current.count).toBe(1);
   });
   ```

8. **Snapshot testing.** Capture component output for regression detection:

   ```tsx
   import { render } from "@testing-library/react-native";
   import { ProfileCard } from "../ProfileCard";

   it("matches snapshot", () => {
     const tree = render(<ProfileCard name="Alice" />);
     expect(tree.toJSON()).toMatchSnapshot();
   });
   ```

   Update snapshots when intentional changes are made: `npx jest --updateSnapshot`.

9. **Run tests.** Execute the suite and check results:

   ```bash
   # Expo
   npx jest
   npx jest --coverage
   npx jest --watch

   # Flutter
   flutter test
   flutter test --coverage
   ```

## Key References

- [Jest: Getting Started](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Expo: Testing](https://docs.expo.dev/develop/unit-testing/)
- [Flutter: Testing](https://docs.flutter.dev/testing)
- [Mocktail for Flutter](https://pub.dev/packages/mocktail)

## Example Interaction

**User:** "I want to add tests to my Expo app. I have components and custom hooks but no tests yet."

**Agent:**
1. Installs jest-expo, @testing-library/react-native, and @testing-library/jest-native with `mobile_installDependency`
2. Adds Jest config to package.json with the jest-expo preset and transform ignore patterns
3. Creates `jest.setup.js` with mocks for native modules used in the project
4. Generates a test file for a key component using `mobile_generateTestFile`
5. Writes a `renderHook` test for the most-used custom hook
6. Runs `mobile_runTests` to verify everything passes
7. Suggests adding `--coverage` to track test coverage over time

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Install test libs | `mobile_installDependency` | Install jest-expo, @testing-library/react-native |
| Generate test file | `mobile_generateTestFile` | Scaffold test boilerplate for an existing component |
| Run test suite | `mobile_runTests` | Execute tests and report pass/fail summary |
| Verify build | `mobile_checkBuildHealth` | Ensure test setup does not break the build |

## Common Pitfalls

1. **Missing transform ignore patterns** - Jest fails on untranspiled node_modules. The `transformIgnorePatterns` array must include every RN-related package that ships untranspiled ESM or JSX.
2. **Testing implementation details** - Test behavior (what the user sees), not internal state. Query by text, role, or testID, not by component internals.
3. **Stale snapshots** - Snapshots become noise if updated blindly. Review every snapshot diff before committing. Delete snapshots that test layout rather than logic.
4. **Not mocking native modules** - Tests crash if native modules like expo-camera or expo-notifications are not mocked. Add mocks in `jest.setup.js`.
5. **Async state not awaited** - Use `waitFor` or `findBy*` queries for components that update state asynchronously. Bare `getBy*` queries miss async renders.
6. **Flutter test imports** - Always import from `package:your_app/...` in tests, not relative paths. The test runner resolves packages differently.

## See Also

- [Mobile E2E Testing](../mobile-e2e-testing/SKILL.md) - end-to-end testing with Detox, Maestro, and Patrol
- [Mobile CI/CD](../mobile-ci-cd/SKILL.md) - run tests automatically in GitHub Actions
- [Mobile Component Patterns](../mobile-component-patterns/SKILL.md) - testable component architecture
