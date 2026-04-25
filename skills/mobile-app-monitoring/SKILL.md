---
name: mobile-app-monitoring
description: Add production application performance monitoring (APM) to a React Native/Expo or Flutter app. Covers Sentry Performance, Datadog RUM, and Instabug for error tracking, performance tracing, session replay, and release health. Includes OpenTelemetry spans, cold/warm start metrics, Apdex scoring, alerting, dashboards, and user impact analysis. Use when the user needs to monitor production errors, track app performance, measure launch times, or set up alerting.
standards-version: 1.7.0
---

# Mobile App Monitoring

## Trigger

Use this skill when the user:

- Wants production error tracking and crash reporting beyond basic Crashlytics
- Asks about APM, performance monitoring, or production observability
- Needs to track app launch times, screen load durations, or API latency
- Mentions "Sentry Performance", "Datadog", "Instabug", "APM", "Apdex", "session replay", or "release health"
- Wants dashboards, alerts, or user impact analysis for production issues
- Is preparing for a production launch and needs monitoring infrastructure

## Required Inputs

- **Framework**: Expo (React Native) or Flutter
- **APM provider**: Sentry Performance (recommended), Datadog RUM, or Instabug
- **Metrics**: what to track (errors, performance, sessions, user actions)
- **Alert thresholds**: error rate %, response time p95, crash-free session rate

## Workflow

1. **Choose an APM provider:**

   | Provider | Strengths | Pricing | Best for |
   |----------|-----------|---------|----------|
   | Sentry Performance | Error grouping, breadcrumbs, source maps, release health | Free tier available | Most mobile apps |
   | Datadog RUM | Full-stack observability, session replay, log correlation | Per session | Enterprise, full-stack teams |
   | Instabug | Bug reporting, surveys, in-app feedback, session replay | Per app | User-facing feedback + monitoring |

2. **Set up Sentry (recommended for Expo):**

   ```bash
   npx expo install @sentry/react-native
   ```

   Use `mobile_setupMonitoring` to generate the monitoring module, then wrap your app:

   ```tsx
   // app/_layout.tsx
   import * as Sentry from "@sentry/react-native";
   import { monitoring } from "../lib/monitoring";

   export default Sentry.wrap(function RootLayout() {
     return <Stack />;
   });
   ```

   Add the Sentry Expo plugin to `app.config`:

   ```tsx
   export default {
     plugins: [
       [
         "@sentry/react-native/expo",
         {
           organization: "your-org",
           project: "your-project",
         },
       ],
     ],
   };
   ```

3. **Set up Sentry for Flutter:**

   ```yaml
   dependencies:
     sentry_flutter: ^7.0.0
   ```

   ```dart
   Future<void> main() async {
     await SentryFlutter.init(
       (options) {
         options.dsn = const String.fromEnvironment('SENTRY_DSN');
         options.tracesSampleRate = 0.2;
       },
       appRunner: () => runApp(const MyApp()),
     );
   }
   ```

4. **Add performance tracing.** Measure what matters:

   ```tsx
   import * as Sentry from "@sentry/react-native";

   async function loadDashboard() {
     const span = Sentry.startInactiveSpan({
       name: "dashboard.load",
       op: "ui.load",
     });

     try {
       const data = await fetchDashboardData();
       renderDashboard(data);
       span?.setStatus({ code: 1, message: "ok" });
     } catch (error) {
       span?.setStatus({ code: 2, message: "error" });
       Sentry.captureException(error);
     } finally {
       span?.end();
     }
   }
   ```

5. **Track app launch performance:**

   ```tsx
   import * as Sentry from "@sentry/react-native";

   const appStartSpan = Sentry.startInactiveSpan({
     name: "app.start",
     op: "app.start.cold",
   });

   export default function App() {
     useEffect(() => {
       appStartSpan?.end();
     }, []);

     return <RootNavigator />;
   }
   ```

6. **Set up alerting.** Configure alerts for critical thresholds:

   - **Crash-free session rate < 99.5%** - immediate alert
   - **Error rate > 1%** - warning alert
   - **API p95 latency > 3s** - warning alert
   - **New error type in release** - notification

   Configure in Sentry Dashboard > Alerts > Create Alert Rule.

7. **Release health tracking.** Tag every error with the release version:

   ```tsx
   Sentry.init({
     dsn: "...",
     release: `com.example.app@${appVersion}`,
     dist: buildNumber,
   });
   ```

   This enables:
   - Per-release error rate comparison
   - Regression detection (new errors in latest release)
   - Adoption tracking (how many users are on each version)

8. **Session replay (Datadog/Instabug).** Record user sessions for debugging:

   ```tsx
   // Datadog session replay
   import { DdRum } from "@datadog/mobile-react-native";

   // Sessions are recorded automatically when RUM is configured
   // Mask sensitive views:
   DdRum.addAttribute("view.name", "PaymentScreen");
   ```

   Session replay captures user interactions, network requests, and errors in context. Useful for reproducing bugs reported by users.

## Key References

- [Sentry React Native](https://docs.sentry.io/platforms/react-native/)
- [Sentry Flutter](https://docs.sentry.io/platforms/flutter/)
- [Datadog Mobile RUM](https://docs.datadoghq.com/real_user_monitoring/mobile_and_tv_monitoring/)
- [Instabug](https://www.instabug.com/)
- [OpenTelemetry](https://opentelemetry.io/)

## Example Interaction

**User:** "I'm launching next week. I need to know immediately if something breaks in production."

**Agent:**
1. Runs `mobile_setupMonitoring` with provider=sentry to generate the monitoring module
2. Installs `@sentry/react-native` via `mobile_installDependency`
3. Wraps the root layout with `Sentry.wrap()`
4. Adds the Sentry Expo config plugin for source map uploads
5. Creates custom spans for key user flows (login, checkout, feed load)
6. Configures alert rules: crash-free rate <99.5%, new error in release, p95 >3s
7. Tags the release with version and build number for regression tracking
8. Reminds the user to set `EXPO_PUBLIC_SENTRY_DSN` in the EAS Secrets dashboard

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Set up APM | `mobile_setupMonitoring` | Generate monitoring module with tracing and error capture |
| Install packages | `mobile_installDependency` | Install @sentry/react-native or sentry_flutter |
| Check build | `mobile_checkBuildHealth` | Verify Sentry plugin is wired correctly |
| Security audit | `mobile_securityAudit` | Ensure DSN is in env vars, not hardcoded |

## Common Pitfalls

1. **100% trace sampling in production** - Sampling all transactions is expensive and can hit Sentry/Datadog quotas fast. Use 10-20% sample rate in production, 100% in dev.
2. **No source maps** - Without source maps, stack traces show minified/bundled code. Configure the Sentry build plugin to upload source maps on every EAS Build.
3. **Missing release tagging** - Without `release` and `dist`, errors cannot be grouped by version. Always set these from your app version and build number.
4. **Alert fatigue** - Too many alerts cause the team to ignore them. Start with 2-3 critical alerts (crash rate, new errors) and expand gradually.
5. **Not tracking custom spans** - Default instrumentation covers crashes but not business logic. Add spans for key flows: login, checkout, search, image upload.
6. **PII in error reports** - Sentry captures breadcrumbs and context that may include user data. Configure `beforeSend` to scrub PII (emails, phone numbers, addresses).

## See Also

- [Mobile Analytics](../mobile-analytics/SKILL.md) - event tracking and crash reporting basics
- [Mobile Debugging](../mobile-debugging/SKILL.md) - development-time debugging tools
- [Mobile CI/CD](../mobile-ci-cd/SKILL.md) - automate source map uploads in the build pipeline
- [Mobile OTA Updates](../mobile-ota-updates/SKILL.md) - ship fixes quickly when monitoring detects regressions
