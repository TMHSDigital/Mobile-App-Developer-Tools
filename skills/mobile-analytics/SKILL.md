---
name: mobile-analytics
description: Add crash reporting and event tracking to a React Native/Expo or Flutter app. Covers Sentry, Firebase Crashlytics, PostHog, source map upload, user identification, session recording, and GDPR compliance. Use when the user wants visibility into crashes, user behavior, or app performance in production.
---

# Mobile Analytics

## Trigger

Use this skill when the user:

- Wants crash reporting or error tracking in production
- Needs event analytics or user behavior tracking
- Asks about Sentry, Firebase Crashlytics, PostHog, or Mixpanel
- Wants to understand how users interact with their app
- Mentions "analytics", "crash reporting", "crashlytics", "sentry", "tracking", "events", or "session recording"

## Required Inputs

- **Analytics type**: crash reporting only, event tracking only, or both
- **Provider**: Sentry (recommended for crash + performance), Firebase Crashlytics, PostHog, or Mixpanel
- **Framework**: Expo (React Native) or Flutter

## Workflow

1. **Choose a provider.** Each has different strengths:

   | Provider | Best for | Free tier | Source maps | Session recording |
   |---|---|---|---|---|
   | Sentry | Crashes + performance monitoring | 5K errors/month | Yes | Yes (beta) |
   | Firebase Crashlytics | Crash-only, Google ecosystem | Unlimited | Yes (via CLI) | No |
   | PostHog | Product analytics + feature flags | 1M events/month | No | Yes |
   | Mixpanel | Event funnels and retention | 20M events/month | No | No |

   You can combine providers. A common pattern is Sentry for crashes + PostHog for product analytics.

2. **Set up Sentry (recommended).** For Expo:

   ```bash
   npx expo install @sentry/react-native
   ```

   Add the config plugin in `app.json`:

   ```json
   {
     "expo": {
       "plugins": [
         [
           "@sentry/react-native/expo",
           {
             "organization": "your-org",
             "project": "your-project"
           }
         ]
       ]
     }
   }
   ```

3. **Initialize Sentry.** In `app/_layout.tsx` or your entry point:

   ```tsx
   import * as Sentry from "@sentry/react-native";

   Sentry.init({
     dsn: process.env.EXPO_PUBLIC_SENTRY_DSN!,
     environment: __DEV__ ? "development" : "production",
     tracesSampleRate: __DEV__ ? 1.0 : 0.2,
     enabled: !__DEV__,
   });
   ```

   Wrap your root component:

   ```tsx
   export default Sentry.wrap(function RootLayout() {
     return <Stack />;
   });
   ```

4. **Upload source maps for readable stack traces.** With EAS Build, add a post-publish hook in `app.json`:

   ```json
   {
     "expo": {
       "hooks": {
         "postPublish": [
           {
             "file": "@sentry/react-native/expo",
             "config": {
               "organization": "your-org",
               "project": "your-project"
             }
           }
         ]
       }
     }
   }
   ```

   Set the auth token in your EAS secrets:

   ```bash
   eas secret:create --name SENTRY_AUTH_TOKEN --value "your-token" --scope project
   ```

5. **Track custom events.** Beyond automatic crash reporting:

   ```tsx
   import * as Sentry from "@sentry/react-native";

   Sentry.addBreadcrumb({
     category: "navigation",
     message: "User opened profile screen",
     level: "info",
   });

   Sentry.captureMessage("User completed onboarding");

   Sentry.captureException(new Error("Payment failed"), {
     tags: { payment_provider: "stripe" },
     extra: { amount: 999, currency: "usd" },
   });
   ```

6. **Set up PostHog for product analytics (optional).** Install:

   ```bash
   npx expo install posthog-react-native
   ```

   Initialize in your app:

   ```tsx
   import { PostHogProvider } from "posthog-react-native";

   export default function RootLayout() {
     return (
       <PostHogProvider
         apiKey={process.env.EXPO_PUBLIC_POSTHOG_KEY!}
         options={{
           host: "https://us.i.posthog.com",
           enableSessionReplay: true,
         }}
       >
         <Stack />
       </PostHogProvider>
     );
   }
   ```

   Track events:

   ```tsx
   import { usePostHog } from "posthog-react-native";

   function CheckoutScreen() {
     const posthog = usePostHog();

     const handlePurchase = () => {
       posthog.capture("purchase_completed", {
         product_id: "premium_yearly",
         price: 39.99,
       });
     };
   }
   ```

7. **Identify users.** Link analytics to authenticated users:

   ```tsx
   // Sentry
   Sentry.setUser({ id: user.id, email: user.email });

   // PostHog
   posthog.identify(user.id, { email: user.email, plan: "premium" });

   // On sign-out, clear the user
   Sentry.setUser(null);
   posthog.reset();
   ```

8. **GDPR and privacy compliance.** Respect user privacy:

   ```tsx
   import * as Sentry from "@sentry/react-native";

   function disableTracking() {
     Sentry.init({ enabled: false });
     posthog.optOut();
   }

   function enableTracking() {
     Sentry.init({ enabled: true, dsn: process.env.EXPO_PUBLIC_SENTRY_DSN! });
     posthog.optIn();
   }
   ```

   Add a privacy settings screen where users can opt out of analytics. Required for EU users under GDPR and recommended for App Store review.

## Key References

- [Sentry: React Native](https://docs.sentry.io/platforms/react-native/)
- [Sentry: Expo integration](https://docs.sentry.io/platforms/react-native/manual-setup/expo/)
- [Firebase Crashlytics: React Native](https://rnfirebase.io/crashlytics/usage)
- [PostHog: React Native](https://posthog.com/docs/libraries/react-native)
- [Mixpanel: React Native](https://docs.mixpanel.com/docs/tracking-methods/sdks/react-native)

## Example Interaction

**User:** "I want crash reporting in production and event tracking for my checkout flow."

**Agent:**
1. Recommends Sentry for crashes + PostHog for event analytics
2. Installs @sentry/react-native and posthog-react-native with `mobile_installDependency`
3. Configures Sentry plugin in app.json with org and project
4. Initializes Sentry in `_layout.tsx` with production-only mode and 20% trace sampling
5. Sets up source map uploads via EAS Build hooks
6. Wraps app in PostHogProvider
7. Adds purchase event tracking in checkout flow: `posthog.capture("purchase_completed", {...})`
8. Implements user identification on login and reset on logout
9. Reminds user to set `EXPO_PUBLIC_SENTRY_DSN` and `EXPO_PUBLIC_POSTHOG_KEY` in `.env`

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Install SDKs | `mobile_installDependency` | Install @sentry/react-native, posthog-react-native |
| Check build | `mobile_checkBuildHealth` | Verify project builds with native Sentry module |
| Validate config | `mobile_checkBuildHealth` | Ensure app.json plugins are correctly configured |
| Build for testing | `mobile_buildForStore` | Create a production build to verify source map upload |

## Common Pitfalls

1. **Leaving analytics enabled in development** - Set `enabled: !__DEV__` to avoid polluting production data with dev crashes and test events.
2. **Missing source maps** - Without source maps, crash stack traces show minified code. Configure the Sentry post-publish hook and set the auth token in EAS secrets.
3. **Over-sampling performance traces** - A `tracesSampleRate` of 1.0 in production generates too much data and slows the app. Use 0.1-0.2 for production.
4. **Not identifying users** - Anonymous crash reports are hard to debug. Call `Sentry.setUser()` after authentication to associate crashes with user accounts.
5. **Tracking PII in events** - Do not log emails, passwords, or payment details in event properties. Sentry and PostHog both have data scrubbing options, but prevention is better.
6. **Ignoring session recording consent** - Session recording captures screen content. Require explicit user consent before enabling it, especially for EU users.
7. **Firebase Crashlytics requires a dev build** - Like most native modules, Crashlytics does not work in Expo Go.

## See Also

- [Mobile Monetization](../mobile-monetization/SKILL.md) - track purchase and subscription events
- [Mobile OTA Updates](../mobile-ota-updates/SKILL.md) - track update adoption and crash rates per release
- [Mobile Auth Setup](../mobile-auth-setup/SKILL.md) - identify users for analytics after authentication
