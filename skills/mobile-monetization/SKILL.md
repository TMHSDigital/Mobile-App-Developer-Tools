---
name: mobile-monetization
description: Add in-app purchases, subscriptions, or one-time payments to a React Native/Expo or Flutter app. Covers RevenueCat, StoreKit 2, Google Play Billing, receipt validation, sandbox testing, and subscription lifecycle. Use when the user wants to charge money inside their app.
---

# Mobile Monetization

## Trigger

Use this skill when the user:

- Wants to add in-app purchases or subscriptions
- Asks about RevenueCat, StoreKit 2, or Google Play Billing
- Needs help with receipt validation or sandbox testing
- Wants to offer a paywall, freemium model, or premium features
- Mentions "monetization", "IAP", "in-app purchase", "subscription", "paywall", or "RevenueCat"

## Required Inputs

- **Monetization model**: subscriptions, one-time purchase, consumables, or hybrid
- **Products**: list of product IDs and price tiers
- **Framework**: Expo (React Native) or Flutter

## Workflow

1. **Choose a monetization SDK.** RevenueCat is recommended for most apps:

   | Option | Best for | Pricing |
   |---|---|---|
   | RevenueCat | Cross-platform, analytics, paywalls | Free up to $2.5K MTR, then 1% |
   | Adapty | A/B testing paywalls, higher free tier | Free up to $5K MTR, then 0.6% |
   | expo-in-app-purchases | Simple Expo-only use cases | Free (Expo SDK) |
   | react-native-iap | Direct StoreKit 2 / Play Billing | Free (community) |

2. **Install RevenueCat.** For Expo:

   ```bash
   npx expo install react-native-purchases
   ```

   For Flutter:

   ```bash
   flutter pub add purchases_flutter
   ```

   Both require a development build (not Expo Go).

3. **Create a RevenueCat account and project.** At https://app.revenuecat.com:

   - Create a new project
   - Add your iOS app with the App Store Connect shared secret
   - Add your Android app with the Play Console service account JSON
   - Create "Entitlements" (e.g. `premium`) and attach product IDs
   - Create "Offerings" to group products into a paywall

4. **Configure products in the stores.**

   **App Store Connect:**
   - Go to Monetization > Subscriptions (or In-App Purchases)
   - Create a subscription group and add products (monthly, yearly)
   - Set pricing for each region
   - Submit for review (products must be reviewed separately from the app)

   **Google Play Console:**
   - Go to Monetize > Products > Subscriptions
   - Create base plans with pricing
   - Activate the products

5. **Initialize RevenueCat in your app.** Create `lib/purchases.ts`:

   ```tsx
   import Purchases from "react-native-purchases";
   import { Platform } from "react-native";

   const API_KEYS = {
     ios: process.env.EXPO_PUBLIC_RC_IOS_KEY!,
     android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY!,
   };

   export async function initPurchases(userId?: string) {
     const key = Platform.select(API_KEYS)!;
     Purchases.configure({ apiKey: key, appUserID: userId });
   }

   export async function getOfferings() {
     const offerings = await Purchases.getOfferings();
     return offerings.current;
   }

   export async function purchasePackage(pkg: any) {
     const { customerInfo } = await Purchases.purchasePackage(pkg);
     return customerInfo.entitlements.active;
   }

   export async function checkEntitlement(id: string): Promise<boolean> {
     const info = await Purchases.getCustomerInfo();
     return info.entitlements.active[id] !== undefined;
   }

   export async function restorePurchases() {
     const info = await Purchases.restorePurchases();
     return info.entitlements.active;
   }
   ```

6. **Build a paywall screen.** Display offerings to the user:

   ```tsx
   import { useEffect, useState } from "react";
   import { View, Text, Pressable, ActivityIndicator } from "react-native";
   import { getOfferings, purchasePackage } from "@/lib/purchases";

   export default function PaywallScreen() {
     const [offerings, setOfferings] = useState<any>(null);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
       getOfferings().then((o) => {
         setOfferings(o);
         setLoading(false);
       });
     }, []);

     if (loading) return <ActivityIndicator />;
     if (!offerings) return <Text>No offerings available</Text>;

     return (
       <View>
         <Text>Upgrade to Premium</Text>
         {offerings.availablePackages.map((pkg: any) => (
           <Pressable
             key={pkg.identifier}
             onPress={() => purchasePackage(pkg)}
           >
             <Text>{pkg.product.title}</Text>
             <Text>{pkg.product.priceString}/
               {pkg.packageType === "MONTHLY" ? "month" : "year"}</Text>
           </Pressable>
         ))}
       </View>
     );
   }
   ```

7. **Gate features on entitlements.** Check access before showing premium content:

   ```tsx
   import { useEffect, useState } from "react";
   import { checkEntitlement } from "@/lib/purchases";

   export function usePremium() {
     const [isPremium, setIsPremium] = useState(false);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
       checkEntitlement("premium").then((active) => {
         setIsPremium(active);
         setLoading(false);
       });
     }, []);

     return { isPremium, loading };
   }
   ```

8. **Handle subscription lifecycle events.** RevenueCat webhooks notify your backend of:

   - Initial purchase
   - Renewal
   - Cancellation
   - Billing issue (grace period)
   - Expiration
   - Refund

   Configure webhooks in RevenueCat dashboard under Project Settings > Integrations.

## Key References

- [RevenueCat: React Native quickstart](https://www.revenuecat.com/docs/getting-started/installation/reactnative)
- [RevenueCat: Flutter quickstart](https://www.revenuecat.com/docs/getting-started/installation/flutter)
- [Expo in-app purchases docs](https://docs.expo.dev/versions/latest/sdk/in-app-purchases/)
- [App Store Review Guidelines: In-App Purchase](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase)
- [Google Play Billing](https://developer.android.com/google/play/billing)

## Example Interaction

**User:** "I want to add a monthly and yearly subscription with a free trial."

**Agent:**
1. Recommends RevenueCat for cross-platform subscription management
2. Installs react-native-purchases with `mobile_installDependency`
3. Creates `lib/purchases.ts` with initialization, offering fetch, and purchase logic
4. Scaffolds a paywall screen showing monthly ($4.99) and yearly ($39.99) options
5. Implements `usePremium` hook to gate features on the "premium" entitlement
6. Walks through App Store Connect and Play Console product creation
7. Reminds user to set `EXPO_PUBLIC_RC_IOS_KEY` and `EXPO_PUBLIC_RC_ANDROID_KEY` in `.env`

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Install SDK | `mobile_installDependency` | Install react-native-purchases or purchases_flutter |
| Create paywall screen | `mobile_generateScreen` | Scaffold paywall with offerings display |
| Check build | `mobile_checkBuildHealth` | Verify project builds with native billing modules |
| Validate store listing | `mobile_validateStoreMetadata` | Check app.json has required fields before submission |

## Common Pitfalls

1. **Testing with real money** - Use sandbox accounts (App Store Connect > Users and Access > Sandbox Testers) and Google Play test tracks. Never test purchases with real cards during development.
2. **Apple requires the Restore button** - Apps with subscriptions or non-consumables must include a "Restore Purchases" button. Apple rejects apps without one.
3. **Forgetting server-side validation** - RevenueCat handles receipt validation automatically. If using raw StoreKit/Play Billing, validate receipts on your server to prevent fraud.
4. **Pricing localization** - App Store and Play Store handle currency conversion automatically. Do not hardcode prices. Always read `priceString` from the product object.
5. **Subscription status caching** - Check entitlement status on every app launch, not just after purchase. Users can cancel or get refunded between sessions.
6. **Not handling billing errors** - Grace periods, payment failures, and expired cards need UI messaging. RevenueCat provides `BILLING_ERROR` events for this.
7. **Expo Go incompatibility** - Native billing modules require a development build. They will crash in Expo Go.

## See Also

- [Mobile App Store Prep](../mobile-app-store-prep/SKILL.md) - store listing requirements for paid apps
- [Mobile Auth Setup](../mobile-auth-setup/SKILL.md) - associate purchases with authenticated users
- [Mobile Analytics](../mobile-analytics/SKILL.md) - track conversion rates and revenue metrics
