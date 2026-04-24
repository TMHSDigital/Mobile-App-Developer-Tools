---
name: mobile-api-integration
description: Integrate REST and GraphQL APIs into a React Native/Expo app. Covers fetch, Axios, React Query, urql, auth headers, retry logic, offline queuing, and optimistic updates. Use when the user needs to connect their app to a backend API.
standards-version: 1.6.3
---

# Mobile API Integration

## Trigger

Use this skill when the user:

- Needs to connect their app to a REST or GraphQL API
- Asks about data fetching, caching, or offline support
- Wants to add auth headers to API requests
- Needs retry logic or error handling for network calls
- Mentions "API", "fetch", "Axios", "REST", "GraphQL", "React Query", "offline", or "cache"

## Required Inputs

- **API type**: REST or GraphQL
- **Auth method**: Bearer token, API key, or none
- **Offline requirements** (optional): queue requests when offline, cache responses, or neither

## Workflow

1. **Choose the right client stack.** Recommendation by use case:

   | Use case | Client | Cache layer |
   |---|---|---|
   | Simple REST, few endpoints | `fetch` | React Query |
   | Complex REST, interceptors | Axios | React Query |
   | GraphQL | urql or Apollo Client | Built-in cache |
   | Real-time GraphQL | urql with subscriptions | Built-in |

   React Query (from the state-management skill) is the cache/state layer for REST. GraphQL clients have their own cache.

2. **Create a typed API client.** In `lib/api.ts`:

   ```tsx
   import * as SecureStore from "expo-secure-store";

   const API_BASE = process.env.EXPO_PUBLIC_API_URL!;

   async function getAuthHeaders(): Promise<Record<string, string>> {
     const token = await SecureStore.getItemAsync("auth_token");
     return token ? { Authorization: `Bearer ${token}` } : {};
   }

   export async function apiRequest<T>(
     endpoint: string,
     options: RequestInit = {},
   ): Promise<T> {
     const authHeaders = await getAuthHeaders();

     const res = await fetch(`${API_BASE}${endpoint}`, {
       ...options,
       headers: {
         "Content-Type": "application/json",
         ...authHeaders,
         ...options.headers,
       },
     });

     if (res.status === 401) {
       // Token expired - trigger refresh or sign out
       await SecureStore.deleteItemAsync("auth_token");
       throw new Error("Session expired. Please sign in again.");
     }

     if (!res.ok) {
       const error = await res.text();
       throw new Error(`API error ${res.status}: ${error}`);
     }

     return res.json();
   }

   export const api = {
     get: <T>(endpoint: string) => apiRequest<T>(endpoint),

     post: <T>(endpoint: string, data: unknown) =>
       apiRequest<T>(endpoint, {
         method: "POST",
         body: JSON.stringify(data),
       }),

     put: <T>(endpoint: string, data: unknown) =>
       apiRequest<T>(endpoint, {
         method: "PUT",
         body: JSON.stringify(data),
       }),

     delete: <T>(endpoint: string) =>
       apiRequest<T>(endpoint, { method: "DELETE" }),
   };
   ```

3. **Use React Query for caching and state.** Create typed query hooks:

   ```tsx
   import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
   import { api } from "@/lib/api";

   interface Todo {
     id: string;
     title: string;
     completed: boolean;
   }

   export function useTodos() {
     return useQuery({
       queryKey: ["todos"],
       queryFn: () => api.get<Todo[]>("/todos"),
       staleTime: 1000 * 60 * 5,
     });
   }

   export function useCreateTodo() {
     const queryClient = useQueryClient();

     return useMutation({
       mutationFn: (title: string) =>
         api.post<Todo>("/todos", { title }),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ["todos"] });
       },
     });
   }
   ```

4. **Optimistic updates.** Update the UI before the server responds:

   ```tsx
   export function useToggleTodo() {
     const queryClient = useQueryClient();

     return useMutation({
       mutationFn: (todo: Todo) =>
         api.put<Todo>(`/todos/${todo.id}`, {
           completed: !todo.completed,
         }),
       onMutate: async (todo) => {
         await queryClient.cancelQueries({ queryKey: ["todos"] });
         const previous = queryClient.getQueryData<Todo[]>(["todos"]);

         queryClient.setQueryData<Todo[]>(["todos"], (old) =>
           old?.map((t) =>
             t.id === todo.id ? { ...t, completed: !t.completed } : t,
           ),
         );

         return { previous };
       },
       onError: (_err, _todo, context) => {
         queryClient.setQueryData(["todos"], context?.previous);
       },
       onSettled: () => {
         queryClient.invalidateQueries({ queryKey: ["todos"] });
       },
     });
   }
   ```

5. **Retry with exponential backoff.** Configure in the QueryClient:

   ```tsx
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         retry: 3,
         retryDelay: (attemptIndex) =>
           Math.min(1000 * 2 ** attemptIndex, 30000),
         staleTime: 1000 * 60 * 5,
       },
       mutations: {
         retry: 1,
       },
     },
   });
   ```

6. **Offline detection and queuing.** Use `@react-native-community/netinfo`:

   ```bash
   npx expo install @react-native-community/netinfo
   ```

   ```tsx
   import NetInfo from "@react-native-community/netinfo";
   import { onlineManager } from "@tanstack/react-query";

   // Auto-refetch when coming back online
   onlineManager.setEventListener((setOnline) => {
     return NetInfo.addEventListener((state) => {
       setOnline(!!state.isConnected);
     });
   });
   ```

   React Query automatically pauses mutations when offline and retries when connectivity returns.

7. **GraphQL with urql.** Install:

   ```bash
   npx expo install urql graphql @urql/exchange-auth
   ```

   ```tsx
   import { Client, cacheExchange, fetchExchange } from "urql";
   import { authExchange } from "@urql/exchange-auth";
   import * as SecureStore from "expo-secure-store";

   const client = new Client({
     url: process.env.EXPO_PUBLIC_GRAPHQL_URL!,
     exchanges: [
       cacheExchange,
       authExchange(async (utils) => ({
         addAuthToOperation: async (operation) => {
           const token = await SecureStore.getItemAsync("auth_token");
           if (!token) return operation;
           return utils.appendHeaders(operation, {
             Authorization: `Bearer ${token}`,
           });
         },
         didAuthError: (error) =>
           error.graphQLErrors.some(
             (e) => e.extensions?.code === "UNAUTHORIZED",
           ),
         refreshAuth: async () => {
           await SecureStore.deleteItemAsync("auth_token");
         },
       })),
       fetchExchange,
     ],
   });
   ```

## Key References

- [TanStack React Query: React Native](https://tanstack.com/query/latest/docs/react/react-native)
- [urql docs](https://commerce.nearform.com/open-source/urql/)
- [NetInfo docs](https://github.com/react-native-netinfo/react-native-netinfo)
- [Expo: Using fetch](https://docs.expo.dev/guides/using-custom-native-modules/)

## Example Interaction

**User:** "I have a REST API at api.example.com. I need auth headers and offline support."

**Agent:**
1. Creates `lib/api.ts` with typed fetch wrapper and auth headers
2. Sets up React Query provider in root layout
3. Creates query hooks for the user's endpoints
4. Adds NetInfo for offline detection with automatic refetch on reconnect
5. Configures retry with exponential backoff
6. Reminds user to set `EXPO_PUBLIC_API_URL` in `.env`

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Install React Query | `mobile_installDependency` | Install tanstack/react-query |
| Install NetInfo | `mobile_installDependency` | Install react-native-community/netinfo for offline detection |
| Generate API client | `mobile_generateComponent` | Scaffold the typed API client module |
| Generate query hooks | `mobile_generateComponent` | Scaffold React Query hook files |
| Check build | `mobile_checkBuildHealth` | Verify project builds with NetInfo native module |

## Common Pitfalls

1. **Not setting staleTime** - Without `staleTime`, React Query refetches on every mount. Set it to at least 60 seconds for most endpoints.
2. **Hardcoding API URLs** - Use `EXPO_PUBLIC_API_URL` environment variable. Different environments (dev, staging, prod) need different URLs.
3. **Missing 401 handling** - Expired tokens cause silent failures. Intercept 401 responses and redirect to sign-in or refresh the token.
4. **Fetching in useEffect** - React Query replaces the `useEffect` + `useState` + `loading` pattern. Using raw `useEffect` leads to race conditions and missing cache invalidation.
5. **No timeout on fetch** - Mobile networks are unreliable. Add `AbortController` with a 15-30 second timeout to prevent indefinite hangs.
6. **Ignoring offline state** - Users lose connectivity frequently. Without offline handling, the app shows infinite loading spinners. Use NetInfo with React Query's `onlineManager`.

## See Also

- [Mobile State Management](../mobile-state-management/SKILL.md) - React Query setup and Zustand for client state
- [Mobile Auth Setup](../mobile-auth-setup/SKILL.md) - auth token management for API headers
- [Mobile Local Storage](../mobile-local-storage/SKILL.md) - caching API responses in SQLite or AsyncStorage
