---
name: mobile-state-management
description: Choose and implement state management for a React Native/Expo app. Covers React state, Zustand, Jotai, and React Query with guidance on when to use each. Use when the user needs to manage global state, server state, or form state.
---

# Mobile State Management

## Trigger

Use this skill when the user:

- Asks how to manage global or shared state in a React Native app
- Wants to fetch and cache server data
- Needs help choosing between state management libraries
- Is dealing with prop drilling or context performance issues
- Mentions "state", "Zustand", "Jotai", "React Query", "TanStack Query", "context", "store", or "cache"

## Required Inputs

- **State type**: What kind of state the user needs (UI state, server/API data, form state, auth state)
- **Current setup** (optional): What they are using now (plain React state, Context, Redux, etc.)
- **Data sources** (optional): What APIs or backends they fetch from

## Workflow

1. **Identify the state category.** Different state types need different solutions:

   | State type | Best tool | Why |
   |---|---|---|
   | Local component UI (toggle, input) | `useState` / `useReducer` | No library needed, keep it simple |
   | Global UI state (theme, sidebar open) | Zustand | Lightweight, no providers, works outside React |
   | Server/API data (lists, user profile) | React Query (TanStack Query) | Handles caching, refetching, loading/error states |
   | Derived/computed atoms | Jotai | Fine-grained reactivity, no re-render cascading |
   | Complex form state | React Hook Form | Validation, field arrays, performance |
   | Auth state | Zustand + SecureStore | Persist tokens securely on device |

2. **Set up Zustand for global UI state.** Install it:

   ```bash
   npx expo install zustand
   ```

   Create a store in `store/useAppStore.ts`:

   ```tsx
   import { create } from "zustand";

   interface AppState {
     theme: "light" | "dark";
     setTheme: (theme: "light" | "dark") => void;
     onboardingComplete: boolean;
     completeOnboarding: () => void;
   }

   export const useAppStore = create<AppState>((set) => ({
     theme: "light",
     setTheme: (theme) => set({ theme }),
     onboardingComplete: false,
     completeOnboarding: () => set({ onboardingComplete: true }),
   }));
   ```

   Usage in a component:

   ```tsx
   import { useAppStore } from "@/store/useAppStore";

   function ThemeToggle() {
     const theme = useAppStore((s) => s.theme);
     const setTheme = useAppStore((s) => s.setTheme);

     return (
       <Switch
         value={theme === "dark"}
         onValueChange={(v) => setTheme(v ? "dark" : "light")}
       />
     );
   }
   ```

3. **Add persistence with Zustand middleware.** For state that survives app restarts:

   ```bash
   npx expo install @react-native-async-storage/async-storage
   ```

   ```tsx
   import { create } from "zustand";
   import { persist, createJSONStorage } from "zustand/middleware";
   import AsyncStorage from "@react-native-async-storage/async-storage";

   export const useAppStore = create<AppState>()(
     persist(
       (set) => ({
         theme: "light",
         setTheme: (theme) => set({ theme }),
         onboardingComplete: false,
         completeOnboarding: () => set({ onboardingComplete: true }),
       }),
       {
         name: "app-storage",
         storage: createJSONStorage(() => AsyncStorage),
       },
     ),
   );
   ```

4. **Set up React Query for server state.** Install it:

   ```bash
   npx expo install @tanstack/react-query
   ```

   Create the provider in `app/_layout.tsx`:

   ```tsx
   import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 1000 * 60 * 5, // 5 minutes
         retry: 2,
       },
     },
   });

   export default function RootLayout() {
     return (
       <QueryClientProvider client={queryClient}>
         <Stack />
       </QueryClientProvider>
     );
   }
   ```

   Create a query hook in `hooks/useUsers.ts`:

   ```tsx
   import { useQuery } from "@tanstack/react-query";

   async function fetchUsers() {
     const res = await fetch("https://api.example.com/users");
     if (!res.ok) throw new Error("Failed to fetch users");
     return res.json();
   }

   export function useUsers() {
     return useQuery({ queryKey: ["users"], queryFn: fetchUsers });
   }
   ```

   Usage:

   ```tsx
   function UserList() {
     const { data, isLoading, error } = useUsers();

     if (isLoading) return <ActivityIndicator />;
     if (error) return <Text>Error: {error.message}</Text>;

     return (
       <FlatList
         data={data}
         keyExtractor={(u) => u.id}
         renderItem={({ item }) => <Text>{item.name}</Text>}
       />
     );
   }
   ```

5. **Use Jotai for fine-grained derived state.** Install:

   ```bash
   npx expo install jotai
   ```

   ```tsx
   import { atom, useAtom } from "jotai";

   const countAtom = atom(0);
   const doubledAtom = atom((get) => get(countAtom) * 2);

   function Counter() {
     const [count, setCount] = useAtom(countAtom);
     const [doubled] = useAtom(doubledAtom);

     return (
       <View>
         <Text>Count: {count}, Doubled: {doubled}</Text>
         <Button title="+" onPress={() => setCount((c) => c + 1)} />
       </View>
     );
   }
   ```

   Jotai is ideal when you have many small, interdependent pieces of state and want to avoid unnecessary re-renders. Zustand is better for fewer, larger state slices.

6. **Recommend a typical stack.** For most Expo apps:

   - **Zustand** for global UI state and auth
   - **React Query** for all API/server data
   - **React state** for local component state
   - Avoid Redux unless the team already uses it

## Key References

- [Zustand docs](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [TanStack React Query docs](https://tanstack.com/query/latest/docs/react/overview)
- [Jotai docs](https://jotai.org/docs/introduction)
- [AsyncStorage docs](https://react-native-async-storage.github.io/async-storage/)

## Example Interaction

**User:** "My app fetches a list of products from an API and I also need a shopping cart that persists when the app closes."

**Agent:**
1. Sets up React Query for the products API (caching, loading states, refetch on focus)
2. Creates a Zustand store with persist middleware for the cart (items, add, remove, clear)
3. Uses AsyncStorage as the persistence backend
4. Shows how to combine both in a product list screen: React Query fetches products, Zustand manages the cart
5. Installs dependencies using `mobile_installDependency`

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Install Zustand | `mobile_installDependency` | Run `npx expo install zustand` |
| Install React Query | `mobile_installDependency` | Run `npx expo install @tanstack/react-query` |
| Generate store file | `mobile_generateComponent` | Scaffold a typed store file |
| Generate hook file | `mobile_generateComponent` | Scaffold a custom query hook |

## Common Pitfalls

1. **Using Context for everything** - React Context re-renders all consumers on every state change. It works for low-frequency updates (theme, locale) but not for frequently changing state (form inputs, counters).
2. **Fetching in useEffect** - React Query replaces the `useEffect` + `useState` + `loading` + `error` pattern. Using raw `useEffect` for data fetching leads to race conditions and missing cache invalidation.
3. **Storing server data in Zustand** - Zustand is for client state. API data belongs in React Query. Mixing them creates stale data and duplicate cache logic.
4. **Not setting staleTime** - Without `staleTime`, React Query refetches on every component mount. Set it to at least 60 seconds for most endpoints.
5. **Persisting sensitive data with AsyncStorage** - AsyncStorage is unencrypted. For auth tokens, use `expo-secure-store` instead.
6. **Selector-less Zustand usage** - Always use selectors (`useAppStore((s) => s.theme)`) to avoid re-rendering on unrelated state changes.

## See Also

- [Mobile Navigation Setup](../mobile-navigation-setup/SKILL.md) - set up routes before wiring state to screens
- [Mobile Component Patterns](../mobile-component-patterns/SKILL.md) - build components that consume state cleanly
