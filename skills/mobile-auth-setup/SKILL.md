---
name: mobile-auth-setup
description: Add authentication to a React Native/Expo app using Supabase, Firebase, or Clerk. Covers email/password, OAuth, token storage with expo-secure-store, protected routes, and session management. Use when the user needs user sign-in or sign-up.
---

# Mobile Auth Setup

## Trigger

Use this skill when the user:

- Wants to add user authentication to their app
- Asks about sign-in, sign-up, or session management
- Needs OAuth (Google, Apple, GitHub) in a mobile app
- Asks how to store auth tokens securely
- Wants protected routes that redirect unauthenticated users
- Mentions "auth", "login", "sign-in", "Supabase", "Firebase Auth", "Clerk", or "session"

## Required Inputs

- **Auth provider**: Supabase, Firebase, or Clerk
- **Sign-in methods**: email/password, OAuth (Google, Apple), magic link, anonymous
- **Token storage preference** (optional): expo-secure-store (default) or AsyncStorage

## Workflow

1. **Choose an auth provider.** Each has trade-offs:

   | Provider | Best for | Pricing | Prebuilt UI |
   |---|---|---|---|
   | Supabase | Full-stack with Postgres | Free tier generous | No (build your own) |
   | Firebase | Google ecosystem, analytics | Free tier, pay-as-you-go | Yes (FirebaseUI) |
   | Clerk | Fast setup, prebuilt components | Free up to 10k MAU | Yes (ClerkProvider) |

2. **Install dependencies.** Example with Supabase:

   ```bash
   npx expo install @supabase/supabase-js expo-secure-store
   ```

   For Firebase:

   ```bash
   npx expo install @react-native-firebase/app @react-native-firebase/auth expo-secure-store
   ```

   For Clerk:

   ```bash
   npx expo install @clerk/clerk-expo expo-secure-store
   ```

3. **Set up secure token storage.** Never use AsyncStorage for auth tokens. Use `expo-secure-store`:

   ```tsx
   import * as SecureStore from "expo-secure-store";

   export const secureStorage = {
     getItem: async (key: string): Promise<string | null> => {
       return SecureStore.getItemAsync(key);
     },
     setItem: async (key: string, value: string): Promise<void> => {
       await SecureStore.setItemAsync(key, value);
     },
     removeItem: async (key: string): Promise<void> => {
       await SecureStore.deleteItemAsync(key);
     },
   };
   ```

4. **Initialize the auth client.** Supabase example in `lib/supabase.ts`:

   ```tsx
   import { createClient } from "@supabase/supabase-js";
   import { secureStorage } from "./secure-storage";

   const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
   const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

   export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
     auth: {
       storage: secureStorage,
       autoRefreshToken: true,
       persistSession: true,
       detectSessionInUrl: false,
     },
   });
   ```

5. **Create an auth store.** Use Zustand to track auth state:

   ```tsx
   import { create } from "zustand";
   import type { Session, User } from "@supabase/supabase-js";
   import { supabase } from "@/lib/supabase";

   interface AuthState {
     session: Session | null;
     user: User | null;
     loading: boolean;
     signIn: (email: string, password: string) => Promise<void>;
     signUp: (email: string, password: string) => Promise<void>;
     signOut: () => Promise<void>;
     initialize: () => void;
   }

   export const useAuth = create<AuthState>((set) => ({
     session: null,
     user: null,
     loading: true,

     signIn: async (email, password) => {
       const { error } = await supabase.auth.signInWithPassword({
         email,
         password,
       });
       if (error) throw error;
     },

     signUp: async (email, password) => {
       const { error } = await supabase.auth.signUp({ email, password });
       if (error) throw error;
     },

     signOut: async () => {
       await supabase.auth.signOut();
       set({ session: null, user: null });
     },

     initialize: () => {
       supabase.auth.getSession().then(({ data: { session } }) => {
         set({ session, user: session?.user ?? null, loading: false });
       });

       supabase.auth.onAuthStateChange((_event, session) => {
         set({ session, user: session?.user ?? null });
       });
     },
   }));
   ```

6. **Protect routes with Expo Router.** In `app/_layout.tsx`:

   ```tsx
   import { useEffect } from "react";
   import { Stack, useRouter, useSegments } from "expo-router";
   import { useAuth } from "@/store/useAuth";

   export default function RootLayout() {
     const { session, loading, initialize } = useAuth();
     const segments = useSegments();
     const router = useRouter();

     useEffect(() => {
       initialize();
     }, []);

     useEffect(() => {
       if (loading) return;

       const inAuthGroup = segments[0] === "(auth)";

       if (!session && !inAuthGroup) {
         router.replace("/(auth)/sign-in");
       } else if (session && inAuthGroup) {
         router.replace("/(tabs)");
       }
     }, [session, loading, segments]);

     if (loading) return null;

     return (
       <Stack>
         <Stack.Screen name="(auth)" options={{ headerShown: false }} />
         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
       </Stack>
     );
   }
   ```

   Directory structure:

   ```
   app/
   ├── _layout.tsx          # Auth redirect logic
   ├── (auth)/
   │   ├── _layout.tsx      # Auth group layout
   │   ├── sign-in.tsx
   │   └── sign-up.tsx
   └── (tabs)/
       ├── _layout.tsx      # Tab bar (protected)
       ├── index.tsx
       └── profile.tsx
   ```

7. **OAuth (Google Sign-In).** With Supabase:

   ```tsx
   import { makeRedirectUri } from "expo-auth-session";
   import * as WebBrowser from "expo-web-browser";

   async function signInWithGoogle() {
     const redirectTo = makeRedirectUri();

     const { data, error } = await supabase.auth.signInWithOAuth({
       provider: "google",
       options: { redirectTo },
     });

     if (data?.url) {
       await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
     }
   }
   ```

   Install required packages:

   ```bash
   npx expo install expo-auth-session expo-web-browser expo-crypto
   ```

## Key References

- [Supabase Auth: React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [Firebase Auth: React Native](https://rnfirebase.io/auth/usage)
- [Clerk: Expo quickstart](https://clerk.com/docs/quickstarts/expo)
- [expo-secure-store docs](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Expo Router: Authentication](https://docs.expo.dev/router/reference/authentication/)

## Example Interaction

**User:** "I want email/password login with Supabase and protected routes."

**Agent:**
1. Installs Supabase and expo-secure-store with `mobile_installDependency`
2. Creates `lib/secure-storage.ts` and `lib/supabase.ts`
3. Creates `store/useAuth.ts` with Zustand auth store
4. Sets up route groups: `(auth)` for sign-in/sign-up, `(tabs)` for protected content
5. Implements redirect logic in root `_layout.tsx`
6. Creates sign-in and sign-up screens with error handling
7. Reminds user to set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Install auth packages | `mobile_installDependency` | Install Supabase/Firebase/Clerk and expo-secure-store |
| Create auth screens | `mobile_generateScreen` | Scaffold sign-in and sign-up screens |
| Create auth store | `mobile_generateComponent` | Scaffold the Zustand auth store |
| Add permissions | `mobile_addPermission` | Add notification permission if using magic links |
| Check build | `mobile_checkBuildHealth` | Verify project builds after adding native auth modules |

## Common Pitfalls

1. **Storing tokens in AsyncStorage** - AsyncStorage is unencrypted. Use `expo-secure-store` for auth tokens, refresh tokens, and API keys.
2. **Not handling token refresh** - Access tokens expire. Supabase handles refresh automatically if `autoRefreshToken: true`. Firebase and Clerk have their own refresh mechanisms.
3. **Hardcoding Supabase URL or anon key** - Use `EXPO_PUBLIC_` environment variables. The anon key is safe to expose (it is rate-limited by RLS), but the service role key must never be in the app.
4. **Blocking the app on auth check** - Show a splash screen or loading indicator while checking the session. Do not render the navigation tree until auth state is known.
5. **OAuth redirect not working** - Expo requires `expo-auth-session` for OAuth flows. Set the redirect URI correctly in both your auth provider dashboard and `makeRedirectUri()`.
6. **Missing `detectSessionInUrl: false`** - Supabase defaults to detecting auth tokens in the URL (for web). Set this to `false` in React Native or it will error.

## See Also

- [Mobile State Management](../mobile-state-management/SKILL.md) - Zustand store patterns used for auth state
- [Mobile Navigation Setup](../mobile-navigation-setup/SKILL.md) - route groups for protected routes
- [Mobile Local Storage](../mobile-local-storage/SKILL.md) - secure storage options for tokens
