import { z } from "zod";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { textResponse, errorResponse } from "../types.js";

const inputSchema = {
  project_path: z
    .string()
    .optional()
    .describe("Absolute path to the project root. Defaults to cwd."),
  provider: z
    .enum(["websocket", "supabase", "socketio"])
    .optional()
    .default("websocket")
    .describe("Real-time provider (default: websocket)."),
  output_directory: z
    .string()
    .optional()
    .default("lib")
    .describe("Output directory relative to project root (default: lib)."),
};

function generateWebSocketClient(): string {
  return `type MessageHandler = (data: unknown) => void;

interface WebSocketClientOptions {
  url: string;
  reconnect?: boolean;
  maxRetries?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<MessageHandler>>();
  private retryCount = 0;
  private url: string;
  private options: WebSocketClientOptions;

  constructor(options: WebSocketClientOptions) {
    this.url = options.url;
    this.options = {
      reconnect: true,
      maxRetries: 5,
      ...options,
    };
  }

  connect(): void {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.retryCount = 0;
      this.options.onOpen?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as {
          type: string;
          payload: unknown;
        };
        const listeners = this.handlers.get(message.type);
        if (listeners) {
          for (const handler of listeners) {
            handler(message.payload);
          }
        }
      } catch {
        // Non-JSON message, ignore
      }
    };

    this.ws.onclose = () => {
      this.options.onClose?.();
      if (this.options.reconnect && this.retryCount < (this.options.maxRetries ?? 5)) {
        const delay = Math.min(1000 * 2 ** this.retryCount, 30000);
        this.retryCount++;
        setTimeout(() => this.connect(), delay);
      }
    };

    this.ws.onerror = (error) => {
      this.options.onError?.(error);
    };
  }

  on(event: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  send(type: string, payload: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  disconnect(): void {
    this.options.reconnect = false;
    this.ws?.close();
    this.ws = null;
    this.handlers.clear();
  }
}
`;
}

function generateSupabaseRealtimeClient(): string {
  return `import { createClient, type RealtimeChannel } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

type ChangeHandler<T> = (payload: {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: T;
}) => void;

type PresenceHandler = (state: Record<string, unknown[]>) => void;

export class RealtimeClient {
  private channels = new Map<string, RealtimeChannel>();

  subscribeToTable<T extends Record<string, unknown>>(
    table: string,
    onChange: ChangeHandler<T>,
    filter?: string,
  ): () => void {
    const channel = supabase
      .channel(\`table-\${table}\`)
      .on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        (payload: any) => {
          onChange({
            eventType: payload.eventType,
            new: payload.new as T,
            old: payload.old as T,
          });
        },
      )
      .subscribe();

    this.channels.set(table, channel);

    return () => {
      supabase.removeChannel(channel);
      this.channels.delete(table);
    };
  }

  joinPresence(
    roomId: string,
    userState: Record<string, unknown>,
    onSync: PresenceHandler,
  ): () => void {
    const channel = supabase
      .channel(\`presence-\${roomId}\`)
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        onSync(state);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track(userState);
        }
      });

    this.channels.set(\`presence-\${roomId}\`, channel);

    return () => {
      supabase.removeChannel(channel);
      this.channels.delete(\`presence-\${roomId}\`);
    };
  }

  disconnectAll(): void {
    for (const channel of this.channels.values()) {
      supabase.removeChannel(channel);
    }
    this.channels.clear();
  }
}
`;
}

function generateSocketIOClient(): string {
  return `import { io, type Socket } from "socket.io-client";

type EventHandler = (...args: unknown[]) => void;

interface SocketClientOptions {
  url: string;
  auth?: Record<string, string>;
  reconnect?: boolean;
}

export class RealtimeClient {
  private socket: Socket | null = null;
  private options: SocketClientOptions;

  constructor(options: SocketClientOptions) {
    this.options = options;
  }

  connect(): void {
    this.socket = io(this.options.url, {
      auth: this.options.auth,
      reconnection: this.options.reconnect ?? true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    });
  }

  on(event: string, handler: EventHandler): () => void {
    this.socket?.on(event, handler);
    return () => {
      this.socket?.off(event, handler);
    };
  }

  emit(event: string, ...args: unknown[]): void {
    this.socket?.emit(event, ...args);
  }

  joinRoom(room: string): void {
    this.socket?.emit("join", room);
  }

  leaveRoom(room: string): void {
    this.socket?.emit("leave", room);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
`;
}

export function register(server: McpServer): void {
  server.tool(
    "mobile_setupRealtime",
    "Add a real-time client module with connection management, event subscriptions, reconnection, and cleanup. Supports raw WebSocket, Supabase Realtime, and Socket.IO.",
    inputSchema,
    async (args) => {
      try {
        const root = args.project_path || process.cwd();
        const outDir = join(root, args.output_directory);
        mkdirSync(outDir, { recursive: true });

        const fileName = "realtime-client.ts";
        const filePath = join(outDir, fileName);

        if (existsSync(filePath)) {
          return errorResponse(new Error(`File already exists: ${filePath}`));
        }

        let content: string;
        let dependencies: string[];

        switch (args.provider) {
          case "supabase":
            content = generateSupabaseRealtimeClient();
            dependencies = ["@supabase/supabase-js"];
            break;
          case "socketio":
            content = generateSocketIOClient();
            dependencies = ["socket.io-client"];
            break;
          default:
            content = generateWebSocketClient();
            dependencies = [];
            break;
        }

        writeFileSync(filePath, content, "utf-8");

        const nextSteps: string[] = [];
        if (dependencies.length > 0) {
          nextSteps.push(`Install dependencies: npx expo install ${dependencies.join(" ")}`);
        }

        switch (args.provider) {
          case "supabase":
            nextSteps.push(
              "Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env",
              "Enable Realtime on your table in the Supabase dashboard",
              "Use subscribeToTable() to listen for INSERT/UPDATE/DELETE events",
              "Use joinPresence() for user presence and typing indicators",
            );
            break;
          case "socketio":
            nextSteps.push(
              "Create a new RealtimeClient({ url: 'wss://your-server' })",
              "Call connect() to establish the connection",
              "Use on() to subscribe and emit() to send events",
              "Call disconnect() in your cleanup/unmount",
            );
            break;
          default:
            nextSteps.push(
              "Create a new RealtimeClient({ url: 'wss://your-server/ws' })",
              "Call connect() to establish the WebSocket connection",
              "Use on() to subscribe to typed events and send() to publish",
              "Call disconnect() in your cleanup/unmount",
              "Reconnection with exponential backoff is built in",
            );
            break;
        }

        return textResponse(
          JSON.stringify(
            {
              success: true,
              provider: args.provider,
              file_created: filePath,
              dependencies_needed: dependencies.length > 0 ? dependencies : undefined,
              next_steps: nextSteps,
            },
            null,
            2,
          ),
        );
      } catch (err) {
        return errorResponse(err);
      }
    },
  );
}
