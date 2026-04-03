---
name: mobile-offline-sync
description: Build offline-first mobile apps with local databases, background sync, conflict resolution, and operation queuing. Covers WatermelonDB, PowerSync, Realm for React Native and Drift, Isar for Flutter. Includes optimistic UI patterns, sync status indicators, and strategies for handling merge conflicts (last-write-wins, CRDT, manual merge). Use when the user needs the app to work without internet, sync data in the background, or handle conflicting edits.
---

# Mobile Offline Sync

## Trigger

Use this skill when the user:

- Wants the app to work without internet connectivity
- Asks about offline-first architecture or local-first data
- Needs background sync, conflict resolution, or operation queuing
- Mentions "offline", "sync", "local database", "conflict resolution", "CRDT", or "queue"
- Wants optimistic UI that updates instantly and syncs later
- Builds apps for unreliable network environments (field work, travel, rural areas)

## Required Inputs

- **Framework**: Expo (React Native) or Flutter
- **Backend**: REST API, GraphQL, Supabase, Firebase, or custom sync server
- **Data model**: what entities need offline support (e.g., tasks, messages, forms)
- **Conflict strategy**: last-write-wins, field-level merge, or manual resolution

## Workflow

1. **Choose a local database.** Pick based on data complexity and sync needs:

   | Library | Framework | Sync built-in | Query language | Best for |
   |---------|-----------|---------------|----------------|----------|
   | WatermelonDB | React Native | Yes (push/pull) | Declarative | Large datasets, fast queries |
   | PowerSync | React Native | Yes (Postgres) | SQL | Supabase/Postgres sync |
   | Realm | React Native | Yes (Atlas) | Object queries | MongoDB ecosystem |
   | expo-sqlite | React Native | No | SQL | Simple, no sync needed |
   | MMKV | React Native | No | Key-value | Settings, small data |
   | Drift | Flutter | No | Type-safe SQL | Complex queries, migrations |
   | Isar | Flutter | No | Object queries | Fast reads, minimal setup |
   | Hive | Flutter | No | Key-value | Simple key-value storage |

2. **Set up WatermelonDB (React Native).** Recommended for offline-first RN apps:

   ```bash
   npx expo install @nozbe/watermelondb
   ```

   ```tsx
   import { Database } from "@nozbe/watermelondb";
   import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
   import { mySchema } from "./schema";
   import { Task } from "./models/Task";

   const adapter = new SQLiteAdapter({
     schema: mySchema,
     migrations: [],
     jsi: true,
   });

   export const database = new Database({
     adapter,
     modelClasses: [Task],
   });
   ```

3. **Set up Drift (Flutter).** Type-safe SQL with code generation:

   ```yaml
   dependencies:
     drift: ^2.15.0
     sqlite3_flutter_libs: ^0.5.0
   dev_dependencies:
     drift_dev: ^2.15.0
     build_runner: ^2.4.0
   ```

   ```dart
   import 'package:drift/drift.dart';

   class Tasks extends Table {
     IntColumn get id => integer().autoIncrement()();
     TextColumn get title => text()();
     BoolColumn get completed => boolean().withDefault(const Constant(false))();
     TextColumn get syncStatus => text().withDefault(const Constant('synced'))();
     DateTimeColumn get updatedAt => dateTime()();
   }

   @DriftDatabase(tables: [Tasks])
   class AppDatabase extends _$AppDatabase {
     AppDatabase(QueryExecutor e) : super(e);

     @override
     int get schemaVersion => 1;

     Future<List<Task>> getPendingSync() =>
         (select(tasks)..where((t) => t.syncStatus.equals('pending'))).get();
   }
   ```

4. **Implement an operation queue.** Buffer writes when offline and replay on reconnect:

   ```tsx
   interface PendingOperation {
     id: string;
     type: "create" | "update" | "delete";
     entity: string;
     payload: Record<string, unknown>;
     createdAt: number;
   }

   class OfflineMutationQueue {
     private queue: PendingOperation[] = [];

     enqueue(op: Omit<PendingOperation, "id" | "createdAt">): void {
       this.queue.push({
         ...op,
         id: crypto.randomUUID(),
         createdAt: Date.now(),
       });
     }

     async flush(
       execute: (op: PendingOperation) => Promise<void>,
     ): Promise<{ succeeded: number; failed: number }> {
       let succeeded = 0;
       let failed = 0;

       while (this.queue.length > 0) {
         const op = this.queue[0];
         try {
           await execute(op);
           this.queue.shift();
           succeeded++;
         } catch {
           failed++;
           break;
         }
       }

       return { succeeded, failed };
     }

     get pending(): number {
       return this.queue.length;
     }
   }
   ```

5. **Handle conflicts.** Choose a strategy based on your data:

   - **Last-write-wins (LWW):** Compare `updatedAt` timestamps. Simplest, but can silently drop edits.
   - **Field-level merge:** Merge non-conflicting field changes. Good for forms and settings.
   - **CRDT (Conflict-free Replicated Data Types):** Mathematically guaranteed convergence. Use for collaborative text editing (Yjs, Automerge).
   - **Manual resolution:** Present both versions to the user and let them choose. Best for critical data.

   ```tsx
   function resolveConflict<T extends { updatedAt: number }>(
     local: T,
     remote: T,
     strategy: "lww" | "keep-local" | "keep-remote",
   ): T {
     switch (strategy) {
       case "lww":
         return local.updatedAt >= remote.updatedAt ? local : remote;
       case "keep-local":
         return local;
       case "keep-remote":
         return remote;
     }
   }
   ```

6. **Add a sync status indicator.** Show users what is synced and what is pending:

   ```tsx
   function SyncStatusBadge({ pendingCount }: { pendingCount: number }) {
     if (pendingCount === 0) {
       return <Text style={styles.synced}>✓ Synced</Text>;
     }
     return (
       <Text style={styles.pending}>
         {pendingCount} change{pendingCount > 1 ? "s" : ""} pending
       </Text>
     );
   }
   ```

7. **Monitor network and trigger sync.**

   ```bash
   npx expo install @react-native-community/netinfo
   ```

   ```tsx
   import NetInfo from "@react-native-community/netinfo";

   NetInfo.addEventListener((state) => {
     if (state.isConnected && queue.pending > 0) {
       queue.flush(executeMutation);
     }
   });
   ```

## Key References

- [WatermelonDB Docs](https://watermelondb.dev/)
- [PowerSync](https://www.powersync.com/)
- [Drift (Flutter)](https://drift.simonbinder.eu/)
- [Isar Database](https://isar.dev/)
- [CRDT Resources](https://crdt.tech/)

## Example Interaction

**User:** "I'm building a field inspection app that needs to work without internet and sync when back online."

**Agent:**
1. Runs `mobile_checkOfflineReady` to assess current offline readiness
2. Installs WatermelonDB for local persistence
3. Defines a schema for inspection reports with a `syncStatus` column
4. Creates a mutation queue that stores pending writes in WatermelonDB
5. Adds NetInfo listener to trigger sync on reconnect
6. Implements last-write-wins conflict resolution with `updatedAt` timestamps
7. Creates a SyncStatusBadge component for the header
8. Adds a manual "Sync Now" button for user-initiated sync

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Check readiness | `mobile_checkOfflineReady` | Validate local DB, network listener, query cache |
| Install packages | `mobile_installDependency` | Install WatermelonDB, NetInfo |
| Generate component | `mobile_generateComponent` | Create SyncStatusBadge, ConflictResolver |
| Check build | `mobile_checkBuildHealth` | Verify native modules link correctly |

## Common Pitfalls

1. **No sync status column** - Without tracking which rows are "pending", "syncing", or "synced", you cannot reliably replay operations. Add a `syncStatus` field to every offline-capable table.
2. **Sync on every keystroke** - Debounce writes. Sync when the user finishes editing (blur event) or on a timer (every 30 seconds), not on every character.
3. **Ignoring conflict resolution** - Two users editing the same record offline will conflict. Silently dropping one edit causes data loss. At minimum, use last-write-wins; prefer field-level merge for important data.
4. **No migration strategy** - Schema changes must handle existing local data. Use WatermelonDB migrations or Drift schema versioning to migrate without data loss.
5. **Unbounded queue growth** - If the server is down for days, the queue grows indefinitely. Set a max queue size and warn the user, or compress sequential edits to the same record.
6. **Not testing offline** - Use airplane mode during development. Test: create data offline, reconnect, verify sync. Test: create conflicting edits on two devices, verify resolution.

## See Also

- [Mobile Local Storage](../mobile-local-storage/SKILL.md) - simpler storage without sync
- [Mobile API Integration](../mobile-api-integration/SKILL.md) - REST/GraphQL clients with caching
- [Mobile Background Tasks](../mobile-background-tasks/SKILL.md) - background sync scheduling
- [Mobile Real-Time](../mobile-real-time/SKILL.md) - real-time sync via WebSockets
