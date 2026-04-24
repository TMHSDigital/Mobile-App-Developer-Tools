---
name: mobile-local-storage
description: Persist data locally in a React Native/Expo app. Covers AsyncStorage for key-value, expo-sqlite for relational data, expo-secure-store for sensitive tokens, and react-native-mmkv for fast synchronous reads. Use when the user needs to store data on the device.
standards-version: 1.6.3
---

# Mobile Local Storage

## Trigger

Use this skill when the user:

- Needs to persist data locally on the device
- Asks about offline storage or caching
- Wants to store auth tokens securely
- Needs a local database (SQLite)
- Mentions "storage", "AsyncStorage", "SQLite", "SecureStore", "MMKV", "offline", or "cache"

## Required Inputs

- **Data type**: key-value settings, structured/relational data, sensitive tokens, or large binary blobs
- **Access pattern**: async is fine vs needs synchronous reads
- **Security level**: public data, private data, or sensitive (tokens, keys)

## Workflow

1. **Choose the right storage.** Each option serves a different purpose:

   | Storage | Best for | Encrypted | Sync/Async | Size limit |
   |---|---|---|---|---|
   | AsyncStorage | Settings, preferences, simple cache | No | Async | ~6MB (Android) |
   | expo-sqlite | Structured data, queries, relations | No (optional) | Async | Disk space |
   | expo-secure-store | Auth tokens, API keys, secrets | Yes (Keychain/Keystore) | Async | ~2KB per item |
   | react-native-mmkv | Fast reads, feature flags, UI state | Optional | Sync | Disk space |

2. **AsyncStorage for simple key-value.** Install:

   ```bash
   npx expo install @react-native-async-storage/async-storage
   ```

   Usage:

   ```tsx
   import AsyncStorage from "@react-native-async-storage/async-storage";

   await AsyncStorage.setItem("onboarding_complete", "true");
   const value = await AsyncStorage.getItem("onboarding_complete");

   // Store objects as JSON
   await AsyncStorage.setItem("user_prefs", JSON.stringify({ theme: "dark" }));
   const prefs = JSON.parse(
     (await AsyncStorage.getItem("user_prefs")) || "{}",
   );
   ```

   AsyncStorage with Zustand persist:

   ```tsx
   import { create } from "zustand";
   import { persist, createJSONStorage } from "zustand/middleware";
   import AsyncStorage from "@react-native-async-storage/async-storage";

   export const useSettings = create<SettingsState>()(
     persist(
       (set) => ({
         theme: "system",
         setTheme: (theme) => set({ theme }),
       }),
       {
         name: "settings",
         storage: createJSONStorage(() => AsyncStorage),
       },
     ),
   );
   ```

3. **expo-sqlite for relational data.** Install:

   ```bash
   npx expo install expo-sqlite
   ```

   Usage:

   ```tsx
   import * as SQLite from "expo-sqlite";

   const db = await SQLite.openDatabaseAsync("app.db");

   // Create table
   await db.execAsync(`
     CREATE TABLE IF NOT EXISTS todos (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       title TEXT NOT NULL,
       completed INTEGER DEFAULT 0,
       created_at TEXT DEFAULT (datetime('now'))
     );
   `);

   // Insert
   await db.runAsync(
     "INSERT INTO todos (title) VALUES (?)",
     "Buy groceries",
   );

   // Query
   const todos = await db.getAllAsync<{
     id: number;
     title: string;
     completed: number;
   }>("SELECT * FROM todos WHERE completed = ?", 0);
   ```

   Migrations pattern:

   ```tsx
   const MIGRATIONS = [
     `CREATE TABLE IF NOT EXISTS todos (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       title TEXT NOT NULL,
       completed INTEGER DEFAULT 0
     )`,
     `ALTER TABLE todos ADD COLUMN created_at TEXT DEFAULT (datetime('now'))`,
     `ALTER TABLE todos ADD COLUMN priority INTEGER DEFAULT 0`,
   ];

   async function migrate(db: SQLite.SQLiteDatabase) {
     await db.execAsync(
       "CREATE TABLE IF NOT EXISTS _migrations (version INTEGER PRIMARY KEY)",
     );

     const result = await db.getFirstAsync<{ version: number }>(
       "SELECT MAX(version) as version FROM _migrations",
     );
     const currentVersion = result?.version ?? -1;

     for (let i = currentVersion + 1; i < MIGRATIONS.length; i++) {
       await db.execAsync(MIGRATIONS[i]);
       await db.runAsync("INSERT INTO _migrations (version) VALUES (?)", i);
     }
   }
   ```

4. **expo-secure-store for sensitive data.** Install:

   ```bash
   npx expo install expo-secure-store
   ```

   Usage:

   ```tsx
   import * as SecureStore from "expo-secure-store";

   // Store a token
   await SecureStore.setItemAsync("auth_token", token);

   // Retrieve
   const token = await SecureStore.getItemAsync("auth_token");

   // Delete on sign-out
   await SecureStore.deleteItemAsync("auth_token");
   ```

   Limits:
   - Values must be strings (JSON.stringify objects)
   - Max ~2KB per item on iOS (Keychain limit)
   - Uses iOS Keychain and Android Keystore (hardware-backed encryption)
   - Not suitable for large data. Use only for tokens, keys, and small secrets.

5. **react-native-mmkv for fast synchronous reads.** Install:

   ```bash
   npx expo install react-native-mmkv
   ```

   Usage:

   ```tsx
   import { MMKV } from "react-native-mmkv";

   const storage = new MMKV();

   // Synchronous - no await needed
   storage.set("hasSeenOnboarding", true);
   const seen = storage.getBoolean("hasSeenOnboarding");

   storage.set("lastSync", Date.now());
   const lastSync = storage.getNumber("lastSync");

   storage.set("userProfile", JSON.stringify(profile));
   const profile = JSON.parse(storage.getString("userProfile") || "{}");
   ```

   MMKV with Zustand:

   ```tsx
   import { MMKV } from "react-native-mmkv";
   import { StateStorage } from "zustand/middleware";

   const mmkv = new MMKV();

   const mmkvStorage: StateStorage = {
     getItem: (name) => mmkv.getString(name) ?? null,
     setItem: (name, value) => mmkv.set(name, value),
     removeItem: (name) => mmkv.delete(name),
   };
   ```

   MMKV is 30x faster than AsyncStorage for reads. Use it for state that is read on every render (feature flags, cached UI state).

6. **Data cleanup.** Clear storage on sign-out or app reset:

   ```tsx
   async function clearAllData() {
     await AsyncStorage.clear();
     await SecureStore.deleteItemAsync("auth_token");
     await SecureStore.deleteItemAsync("refresh_token");
     // MMKV
     storage.clearAll();
     // SQLite - drop and recreate
     await db.execAsync("DROP TABLE IF EXISTS todos");
     await migrate(db);
   }
   ```

## Key References

- [AsyncStorage docs](https://react-native-async-storage.github.io/async-storage/)
- [expo-sqlite docs](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [expo-secure-store docs](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [react-native-mmkv docs](https://github.com/mrousavy/react-native-mmkv)

## Example Interaction

**User:** "I need offline-capable todo list with secure user login."

**Agent:**
1. Sets up expo-sqlite for todo data with `mobile_installDependency`
2. Creates a migration system for the todos table
3. Sets up expo-secure-store for auth tokens
4. Creates CRUD operations (add, complete, delete todos)
5. Shows how to sync with a server when online
6. Implements `clearAllData` for sign-out

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Install storage packages | `mobile_installDependency` | Install AsyncStorage, expo-sqlite, expo-secure-store, or MMKV |
| Generate storage module | `mobile_generateComponent` | Scaffold a storage utility file |
| Check build | `mobile_checkBuildHealth` | Verify project builds with native storage modules |

## Common Pitfalls

1. **Storing tokens in AsyncStorage** - AsyncStorage is not encrypted. Auth tokens, API keys, and secrets must use `expo-secure-store`.
2. **Exceeding SecureStore limits** - iOS Keychain limits items to ~2KB. Do not store large objects. Use it only for tokens and small secrets.
3. **Blocking the UI with SQLite** - Large queries can freeze the UI. Use `getAllAsync` instead of synchronous methods, and run heavy queries outside the render cycle.
4. **Not handling migration failures** - SQLite `ALTER TABLE` is limited. You cannot remove columns or change types. Plan migrations carefully.
5. **AsyncStorage 6MB limit on Android** - Android's default SQLite-backed AsyncStorage has a ~6MB limit. For larger data, use expo-sqlite directly.
6. **Forgetting to clear on sign-out** - Sensitive cached data persists after sign-out unless explicitly cleared. Always wipe user-specific storage on logout.

## See Also

- [Mobile Auth Setup](../mobile-auth-setup/SKILL.md) - secure token storage for auth
- [Mobile State Management](../mobile-state-management/SKILL.md) - Zustand persist with storage backends
- [Mobile API Integration](../mobile-api-integration/SKILL.md) - caching API responses locally
