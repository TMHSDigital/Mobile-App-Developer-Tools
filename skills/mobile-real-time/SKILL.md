---
name: mobile-real-time
description: Add real-time features to a React Native/Expo or Flutter app. Covers WebSockets, Supabase Realtime, Socket.IO, server-sent events, connection lifecycle, reconnection with exponential backoff, typed event channels, presence indicators, and offline queue with sync on reconnect. Use when the user wants live chat, real-time updates, typing indicators, or collaborative features.
standards-version: 1.7.0
---

# Mobile Real-Time

## Trigger

Use this skill when the user:

- Wants live data updates without polling (chat, notifications, dashboards)
- Asks about WebSockets, Supabase Realtime, Socket.IO, or SSE
- Needs presence indicators, typing status, or online/offline detection
- Mentions "real-time", "websocket", "live updates", "chat", "push data", "socket", or "streaming"
- Wants to sync data between multiple clients in real time

## Required Inputs

- **Framework**: Expo (React Native) or Flutter
- **Provider**: raw WebSocket, Supabase Realtime (recommended with Supabase backend), Socket.IO, or SSE
- **Use case**: chat, live feed, collaborative editing, notifications, or presence

## Workflow

1. **Choose a real-time provider.** Each fits different backends:

   | Provider | Best for | Server needed | Reconnection | Presence |
   |---|---|---|---|---|
   | WebSocket (raw) | Custom backends | Any WS server | Manual | Manual |
   | Supabase Realtime | Supabase projects | Supabase | Built-in | Built-in |
   | Socket.IO | Node.js backends | Socket.IO server | Built-in | Plugin |
   | SSE | One-way server push | Any HTTP server | Browser native | No |

   Supabase Realtime is the easiest if you already use Supabase. Raw WebSocket gives the most control.

2. **Set up a WebSocket client.** A typed client with reconnection:

   ```tsx
   import { useEffect, useRef, useCallback } from "react";

   interface WSMessage {
     type: string;
     payload: unknown;
   }

   export function useWebSocket(url: string) {
     const ws = useRef<WebSocket | null>(null);
     const retryCount = useRef(0);

     const connect = useCallback(() => {
       ws.current = new WebSocket(url);

       ws.current.onopen = () => {
         retryCount.current = 0;
       };

       ws.current.onclose = () => {
         const delay = Math.min(1000 * 2 ** retryCount.current, 30000);
         retryCount.current++;
         setTimeout(connect, delay);
       };
     }, [url]);

     const send = useCallback((type: string, payload: unknown) => {
       if (ws.current?.readyState === WebSocket.OPEN) {
         ws.current.send(JSON.stringify({ type, payload }));
       }
     }, []);

     const subscribe = useCallback(
       (type: string, handler: (payload: unknown) => void) => {
         const listener = (event: MessageEvent) => {
           const msg: WSMessage = JSON.parse(event.data);
           if (msg.type === type) handler(msg.payload);
         };
         ws.current?.addEventListener("message", listener);
         return () => ws.current?.removeEventListener("message", listener);
       },
       [],
     );

     useEffect(() => {
       connect();
       return () => {
         retryCount.current = Infinity;
         ws.current?.close();
       };
     }, [connect]);

     return { send, subscribe };
   }
   ```

3. **Set up Supabase Realtime.** Listen to database changes:

   ```bash
   npx expo install @supabase/supabase-js
   ```

   ```tsx
   import { createClient } from "@supabase/supabase-js";
   import { useEffect, useState } from "react";

   const supabase = createClient(
     process.env.EXPO_PUBLIC_SUPABASE_URL!,
     process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
   );

   export function useRealtimeTable<T extends Record<string, unknown>>(
     table: string,
   ) {
     const [rows, setRows] = useState<T[]>([]);

     useEffect(() => {
       supabase.from(table).select("*").then(({ data }) => {
         if (data) setRows(data as T[]);
       });

       const channel = supabase
         .channel(`table-${table}`)
         .on(
           "postgres_changes",
           { event: "*", schema: "public", table },
           (payload) => {
             if (payload.eventType === "INSERT") {
               setRows((prev) => [...prev, payload.new as T]);
             } else if (payload.eventType === "UPDATE") {
               setRows((prev) =>
                 prev.map((r) =>
                   (r as any).id === (payload.new as any).id
                     ? (payload.new as T)
                     : r,
                 ),
               );
             } else if (payload.eventType === "DELETE") {
               setRows((prev) =>
                 prev.filter((r) => (r as any).id !== (payload.old as any).id),
               );
             }
           },
         )
         .subscribe();

       return () => {
         supabase.removeChannel(channel);
       };
     }, [table]);

     return rows;
   }
   ```

4. **Add presence and typing indicators.** Supabase Realtime has built-in presence:

   ```tsx
   function useChatPresence(roomId: string, userId: string) {
     const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

     useEffect(() => {
       const channel = supabase.channel(`room-${roomId}`);

       channel
         .on("presence", { event: "sync" }, () => {
           const state = channel.presenceState();
           const users = Object.values(state)
             .flat()
             .map((p: any) => p.user_id);
           setOnlineUsers(users);
         })
         .subscribe(async (status) => {
           if (status === "SUBSCRIBED") {
             await channel.track({ user_id: userId });
           }
         });

       return () => {
         supabase.removeChannel(channel);
       };
     }, [roomId, userId]);

     return onlineUsers;
   }
   ```

5. **Set up Socket.IO.** For Node.js backends:

   ```bash
   npx expo install socket.io-client
   ```

   ```tsx
   import { io } from "socket.io-client";
   import { useEffect, useRef, useState } from "react";

   export function useSocket(url: string) {
     const socket = useRef(io(url, { autoConnect: false }));
     const [connected, setConnected] = useState(false);

     useEffect(() => {
       const s = socket.current;
       s.on("connect", () => setConnected(true));
       s.on("disconnect", () => setConnected(false));
       s.connect();

       return () => {
         s.disconnect();
       };
     }, []);

     return { socket: socket.current, connected };
   }
   ```

6. **Offline queue.** Buffer messages when disconnected and flush on reconnect:

   ```tsx
   class OfflineQueue {
     private queue: Array<{ type: string; payload: unknown }> = [];

     enqueue(type: string, payload: unknown): void {
       this.queue.push({ type, payload });
     }

     flush(send: (type: string, payload: unknown) => void): void {
       while (this.queue.length > 0) {
         const msg = this.queue.shift()!;
         send(msg.type, msg.payload);
       }
     }
   }
   ```

7. **Server-sent events.** One-way streaming from server to client:

   ```tsx
   function useSSE<T>(url: string) {
     const [data, setData] = useState<T | null>(null);

     useEffect(() => {
       const source = new EventSource(url);
       source.onmessage = (event) => {
         setData(JSON.parse(event.data));
       };
       return () => source.close();
     }, [url]);

     return data;
   }
   ```

## Key References

- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [React Native EventSource polyfill](https://github.com/binaryminds/react-native-sse)

## Example Interaction

**User:** "I want a chat feature with real-time messages and typing indicators using Supabase."

**Agent:**
1. Runs `mobile_setupRealtime` with provider=supabase
2. Installs @supabase/supabase-js with `mobile_installDependency`
3. Creates a `useRealtimeTable` hook for the messages table
4. Creates a `useChatPresence` hook for online/typing indicators
5. Generates a ChatScreen with message list, input field, and send button
6. Adds optimistic message insertion (show immediately, confirm on server response)
7. Implements typing indicator by tracking presence metadata
8. Reminds user to enable Realtime on the messages table in Supabase dashboard

## MCP Usage

| Step | MCP Tool | Description |
|------|----------|-------------|
| Set up client | `mobile_setupRealtime` | Generate real-time client module with reconnection |
| Install packages | `mobile_installDependency` | Install @supabase/supabase-js or socket.io-client |
| Generate screen | `mobile_generateScreen` | Create a chat or live feed screen |
| Generate component | `mobile_generateComponent` | Create message bubble, typing indicator components |

## Common Pitfalls

1. **No reconnection logic** - WebSocket connections drop on network changes. Always implement reconnection with exponential backoff (1s, 2s, 4s, ..., max 30s).
2. **Memory leaks from unsubscribed channels** - Call `removeChannel()` or `close()` in cleanup. Every `useEffect` that subscribes must return an unsubscribe function.
3. **Supabase Realtime not enabled** - Database changes are not broadcast by default. Enable Realtime on each table in the Supabase dashboard under Database > Replication.
4. **Missing auth for WebSocket** - WebSocket does not send cookies automatically. Pass auth tokens in the connection URL query string or in the first message after connect.
5. **Flooding the UI with updates** - Batch rapid updates with `requestAnimationFrame` or a debounce. Rendering every single keystroke from a typing indicator causes jank.
6. **SSE not supported in React Native** - The native `EventSource` is not available. Use a polyfill like `react-native-sse`.

## See Also

- [Mobile API Integration](../mobile-api-integration/SKILL.md) - REST/GraphQL for non-real-time data fetching
- [Mobile Auth Setup](../mobile-auth-setup/SKILL.md) - authenticate WebSocket connections
- [Mobile Local Storage](../mobile-local-storage/SKILL.md) - cache real-time data locally for offline access
- [Mobile Push Notifications](../mobile-push-notifications/SKILL.md) - fallback notifications when the app is backgrounded
