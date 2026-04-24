---
name: mobile-feature-flags
description: Feature flag management with PostHog, LaunchDarkly, or Firebase Remote Config for React Native/Expo and Flutter
standards-version: 1.6.3
---

# Mobile Feature Flags

## Trigger

Use this skill when the developer asks about:
- Feature flags, feature toggles, or feature switches
- A/B testing or experimentation frameworks
- Staged rollouts or percentage-based releases
- Kill switches for disabling features remotely
- PostHog, LaunchDarkly, or Firebase Remote Config integration
- Typed flag definitions with default values
- User targeting or segmentation for features

## Required Inputs

| Input | Description |
| --- | --- |
| Framework | `expo` (React Native) or `flutter` |
| Provider | `posthog`, `launchdarkly`, or `firebase` |

## Workflow

### 1. Scaffold Feature Flag Module

Run `mobile_setupFeatureFlags` to generate the typed provider:

```
Use MCP tool: mobile_setupFeatureFlags
  framework: "expo"
  provider: "posthog"
  output_directory: "lib"
```

This creates a `feature-flags.ts` (or `.dart`) file with:
- Typed flag enum/interface with default values
- Provider initialization
- `getFlag()` / `useFeatureFlag()` helpers
- User identification for targeting

### 2. React Native / Expo Patterns

#### PostHog (Recommended)

```tsx
import { useFeatureFlag, identifyUser } from "@/lib/feature-flags";

// After auth
identifyUser(user.id, { plan: user.plan, region: user.region });

// In components
function SettingsScreen() {
  const showNewOnboarding = useFeatureFlag("new_onboarding");

  return showNewOnboarding ? <NewOnboarding /> : <LegacyOnboarding />;
}
```

#### LaunchDarkly

```tsx
import { initFeatureFlags, getFlag, onFlagChange } from "@/lib/feature-flags";

await initFeatureFlags(user.id);
const isPremium = getFlag("premium_features");

const unsubscribe = onFlagChange("premium_features", (value) => {
  console.log("Flag changed:", value);
});
```

#### Firebase Remote Config

```tsx
import { initFeatureFlags, getFlag, refreshFlags } from "@/lib/feature-flags";

await initFeatureFlags();
const showExperimental = getFlag("experimental_ui");

// Refresh on app foreground
useEffect(() => {
  const sub = AppState.addEventListener("change", (state) => {
    if (state === "active") refreshFlags();
  });
  return () => sub.remove();
}, []);
```

### 3. Flutter Patterns

```dart
final flags = FeatureFlagService();
await flags.init();

if (flags.isEnabled(FeatureFlag.newOnboarding)) {
  // Show new flow
} else {
  // Show legacy flow
}

// Debug overrides (dev builds only)
if (kDebugMode) {
  flags.setOverride(FeatureFlag.experimentalUi, true);
}
```

### 4. Best Practices

#### Adding New Flags

1. Add to the `FeatureFlags` type/enum with a **safe default** (usually `false`)
2. Create the flag in your provider dashboard
3. Use the flag in code
4. Set targeting rules in the dashboard
5. Remove the flag after full rollout

#### Staged Rollout Example

| Stage | % of Users | Duration | Criteria |
| --- | --- | --- | --- |
| Internal | 0% (staff only) | 1 week | Employee targeting |
| Canary | 5% | 3 days | Monitor crash rates |
| Beta | 25% | 1 week | Monitor metrics |
| GA | 100% |  - | Remove flag |

#### Kill Switch Pattern

```tsx
const isFeatureDisabled = useFeatureFlag("kill_switch_payments");
if (isFeatureDisabled) {
  return <MaintenanceScreen />;
}
```

## Key References

| Resource | URL |
| --- | --- |
| PostHog React Native | https://posthog.com/docs/libraries/react-native |
| LaunchDarkly React Native | https://docs.launchdarkly.com/sdk/client-side/react-native |
| Firebase Remote Config | https://firebase.google.com/docs/remote-config |
| PostHog Feature Flags | https://posthog.com/docs/feature-flags |

## Example Interaction

**User:** "Set up feature flags with PostHog so I can do staged rollouts"

**Assistant:**
1. Runs `mobile_setupFeatureFlags` with `provider: "posthog"` to generate typed flag module
2. Runs `mobile_installDependency` to install `posthog-react-native`
3. Shows how to add `EXPO_PUBLIC_POSTHOG_KEY` to `.env`
4. Demonstrates `useFeatureFlag("new_onboarding")` in a component
5. Explains staged rollout process: internal → 5% canary → 25% beta → 100% GA
6. Shows how to call `identifyUser()` after authentication for user targeting

## MCP Usage

| Tool | When |
| --- | --- |
| `mobile_setupFeatureFlags` | Generate the typed feature flag module |
| `mobile_installDependency` | Install the provider SDK package |

## Common Pitfalls

- **No default values**  - always define a safe fallback; network requests can fail.
- **Stale flags**  - refresh on app foreground, not just on launch.
- **Flag debt**  - remove flags after full rollout; stale flags accumulate complexity.
- **Testing without flags**  - unit tests should mock flag values for both branches.
- **Targeting before identification**  - call `identify()` before reading user-targeted flags.
- **Boolean-only flags**  - some providers support string/JSON flags for multivariate tests.

## See Also

- `mobile-analytics`  - track flag impressions and conversion events
- `mobile-ci-cd`  - CI checks that verify flag defaults match expectations
- `mobile-ota-updates`  - combine flags with OTA channels for staged releases
